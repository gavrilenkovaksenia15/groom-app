// ===== Главный модуль: работа с окнами =====
const $ = id => document.getElementById(id);

const STATUS = {
  new:       { text: "Новая",        cls: "st-new" },
  confirmed: { text: "Подтверждена", cls: "st-ok" },
  done:      { text: "Выполнена",    cls: "st-done" },
  cancelled: { text: "Отменена",     cls: "st-cancel" }
};
const TITLES = {
  home: SALON.name, services: "Услуги", datetime: "Дата и время", form: "Данные",
  done: "Готово", my: "Мои записи", login: "Вход", admin: "Журнал записей"
};
const WEEK = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

const app = {
  current: "home",
  history: [],
  order: {},          // текущая запись: услуга, дата, время
  adminDate: null,

  init() {
    const res = createStore();
    this.store = res.store;
    this.schedule = new Schedule(SALON, this.store);
    $("mode").textContent = res.online ? "онлайн" : "демо";
    $("mode").className = "mode " + (res.online ? "on" : "off");

    document.querySelectorAll(".salon-name").forEach(e => e.textContent = SALON.name);
    $("salonAddress").textContent = SALON.address + " · " + SALON.phone;
    $("salonHours").textContent = "Работаем с " + SALON.workStart + ":00 до " + SALON.workEnd + ":00";

    document.querySelectorAll("[data-go]").forEach(b =>
      b.addEventListener("click", () => this.go(b.dataset.go)));
    $("btnBack").addEventListener("click", () => this.back());
    $("btnToForm").addEventListener("click", () => this.showForm());
    $("bookingForm").addEventListener("submit", e => { e.preventDefault(); this.submit(); });
    $("btnFind").addEventListener("click", () => this.findMy());
    $("btnLogin").addEventListener("click", () => this.login());
    $("btnLogout").addEventListener("click", () => { sessionStorage.removeItem("groomer"); this.go("home", true); });

    this.renderServices();
  },

  // Переход между окнами
  go(name, reset) {
    if (name === "admin" || name === "login") {
      if (sessionStorage.getItem("groomer")) name = "admin";
    }
    if (reset || name === "home") this.history = [];
    else if (this.current !== name) this.history.push(this.current);
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    $("screen-" + name).classList.remove("hidden");
    $("title").textContent = TITLES[name];
    $("btnBack").classList.toggle("hidden", name === "home");
    this.current = name;
    window.scrollTo(0, 0);
    if (name === "datetime") this.renderDays();
    if (name === "admin") this.renderAdmin();
  },
  back() {
    const prev = this.history.pop() || "home";
    const rest = this.history;
    this.go(prev, true);
    this.history = prev === "home" ? [] : rest;
  },

  toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.classList.remove("hidden");
    clearTimeout(this._t);
    this._t = setTimeout(() => t.classList.add("hidden"), 2500);
  },

  // ---------- Окно 2: услуги ----------
  renderServices() {
    $("serviceList").innerHTML = SERVICES.map(s => `
      <div class="card service" data-id="${s.id}">
        <div class="icon">${s.icon}</div>
        <div class="info">
          <b>${s.name}</b>
          <span class="muted">${s.description}</span>
          <span class="meta">${s.hours} ч · <b>${s.price} ₽</b></span>
        </div>
      </div>`).join("");
    document.querySelectorAll(".service").forEach(c =>
      c.addEventListener("click", () => {
        this.order = { service: findService(c.dataset.id) };
        this.go("datetime");
      }));
  },

  // ---------- Окно 3: дата и время ----------
  renderDays() {
    const s = this.order.service;
    $("chosenService").innerHTML = `${s.icon} <b>${s.name}</b> · ${s.hours} ч · ${s.price} ₽`;
    const days = this.schedule.getWorkDays();
    $("dayList").innerHTML = days.map(d => `
      <button class="chip day" data-date="${Schedule.toKey(d)}">
        <small>${WEEK[d.getDay()]}</small><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small>
      </button>`).join("");
    document.querySelectorAll(".day").forEach(b =>
      b.addEventListener("click", () => this.pickDay(b)));
    $("slotList").innerHTML = '<p class="muted">Сначала выберите день</p>';
    $("btnToForm").disabled = true;
    this.order.date = null; this.order.time = null;
  },

  async pickDay(btn) {
    document.querySelectorAll(".day").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    this.order.date = btn.dataset.date;
    this.order.time = null;
    $("btnToForm").disabled = true;
    $("slotList").innerHTML = '<p class="muted">Загрузка…</p>';
    const free = await this.schedule.getFreeSlots(this.order.date, this.order.service.hours);
    if (free.length === 0) {
      $("slotList").innerHTML = '<p class="muted">На этот день свободного времени нет</p>';
      return;
    }
    $("slotList").innerHTML = free.map(t =>
      `<button class="chip slot" data-time="${t}">${t}:00</button>`).join("");
    document.querySelectorAll(".slot").forEach(b =>
      b.addEventListener("click", () => {
        document.querySelectorAll(".slot").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        this.order.time = Number(b.dataset.time);
        $("btnToForm").disabled = false;
      }));
  },

  // ---------- Окно 4: форма ----------
  showForm() {
    $("summary").innerHTML = this.orderText();
    $("formError").textContent = "";
    this.go("form");
  },

  orderText() {
    const o = this.order;
    return `${o.service.icon} <b>${o.service.name}</b><br>📅 ${app.dateText(o.date)}, ${o.time}:00–${o.time + o.service.hours}:00<br>💳 ${o.service.price} ₽`;
  },

  dateText(key) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return d + " " + MONTHS[m - 1] + " (" + WEEK[dt.getDay()] + ")";
  },

  cleanPhone(p) {
    let digits = p.replace(/\D/g, "");
    if (digits.length === 11 && digits[0] === "8") digits = "7" + digits.slice(1);
    if (digits.length === 10) digits = "7" + digits;
    return digits;
  },

  formatPhone(d) {
    return "+" + d[0] + " " + d.slice(1, 4) + " " + d.slice(4, 7) + "-" + d.slice(7, 9) + "-" + d.slice(9);
  },

  async submit() {
    const pet = $("fPet").value.trim();
    const owner = $("fOwner").value.trim();
    const phone = this.cleanPhone($("fPhone").value);
    if (!pet || !owner) { $("formError").textContent = "Заполните поля, отмеченные звёздочкой"; return; }
    if (phone.length !== 11) { $("formError").textContent = "Проверьте номер телефона"; return; }

    const btn = $("btnSubmit");
    btn.disabled = true;
    try {
      // Проверяем ещё раз, не занял ли кто-то это время
      const o = this.order;
      const free = await this.schedule.getFreeSlots(o.date, o.service.hours);
      if (!free.includes(o.time)) {
        $("formError").textContent = "Это время уже заняли. Вернитесь и выберите другое.";
        return;
      }
      const booking = new Booking({
        serviceId: o.service.id, serviceName: o.service.name, price: o.service.price,
        hours: o.service.hours, date: o.date, time: o.time,
        petName: pet, petType: $("fType").value, petBreed: $("fBreed").value.trim(),
        ownerName: owner, phone: phone, comment: $("fComment").value.trim()
      });
      await this.store.add(booking);
      localStorage.setItem("groom_phone", phone);
      $("doneInfo").innerHTML = this.orderText() + `<br>🐾 ${pet}`;
      $("bookingForm").reset();
      this.go("done", true);
    } catch (e) {
      $("formError").textContent = "Ошибка связи. Попробуйте ещё раз.";
      console.log(e);
    } finally {
      btn.disabled = false;
    }
  },

  // ---------- Окно 6: мои записи ----------
  async findMy() {
    const phone = this.cleanPhone($("myPhone").value);
    if (phone.length !== 11) { this.toast("Введите номер телефона полностью"); return; }
    $("myList").innerHTML = '<p class="muted">Загрузка…</p>';
    const list = await this.store.getByPhone(phone);
    list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    if (list.length === 0) { $("myList").innerHTML = '<p class="muted">Записей не найдено</p>'; return; }
    $("myList").innerHTML = list.map(b => `
      <div class="card">
        <div class="row"><b>${b.serviceName}</b><span class="badge ${STATUS[b.status].cls}">${STATUS[b.status].text}</span></div>
        <div class="muted">📅 ${this.dateText(b.date)}, ${b.time}:00 · 🐾 ${b.petName} · ${b.price} ₽</div>
        ${(b.status === "new" || b.status === "confirmed")
          ? `<button class="btn small ghost cancel" data-id="${b.id}">Отменить запись</button>` : ""}
      </div>`).join("");
    document.querySelectorAll(".cancel").forEach(btn =>
      btn.addEventListener("click", async () => {
        await this.store.setStatus(btn.dataset.id, "cancelled");
        this.toast("Запись отменена");
        this.findMy();
      }));
  },

  // ---------- Окна 7–8: грумер ----------
  login() {
    if ($("pin").value === SALON.groomerPin) {
      sessionStorage.setItem("groomer", "1");
      $("pin").value = ""; $("pinError").textContent = "";
      this.go("admin", true);
    } else {
      $("pinError").textContent = "Неверный PIN-код";
    }
  },

  renderAdmin() {
    const days = this.schedule.getWorkDays();
    if (!this.adminDate) this.adminDate = Schedule.toKey(days[0] || new Date());
    $("adminDays").innerHTML = days.map(d => {
      const k = Schedule.toKey(d);
      return `<button class="chip day ${k === this.adminDate ? "active" : ""}" data-date="${k}">
        <small>${WEEK[d.getDay()]}</small><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()]}</small></button>`;
    }).join("");
    document.querySelectorAll("#adminDays .day").forEach(b =>
      b.addEventListener("click", () => { this.adminDate = b.dataset.date; this.renderAdmin(); }));
    this.loadAdminList();
  },

  async loadAdminList() {
    $("adminList").innerHTML = '<p class="muted">Загрузка…</p>';
    const list = (await this.store.getByDate(this.adminDate)).sort((a, b) => a.time - b.time);
    const active = list.filter(b => b.status !== "cancelled");
    const income = list.filter(b => b.status === "done").reduce((s, b) => s + b.price, 0);
    $("stats").innerHTML = `
      <div><b>${active.length}</b><small>записей</small></div>
      <div><b>${active.reduce((s, b) => s + b.hours, 0)} ч</b><small>занято</small></div>
      <div><b>${income} ₽</b><small>выручка</small></div>`;
    if (list.length === 0) { $("adminList").innerHTML = '<p class="muted">На этот день записей нет</p>'; return; }
    $("adminList").innerHTML = list.map(b => `
      <div class="card">
        <div class="row"><b>${b.time}:00–${b.time + b.hours}:00 · ${b.serviceName}</b>
          <span class="badge ${STATUS[b.status].cls}">${STATUS[b.status].text}</span></div>
        <div>🐾 ${b.petName} (${b.petType}${b.petBreed ? ", " + b.petBreed : ""})</div>
        <div class="muted">👤 ${b.ownerName} · <a href="tel:+${b.phone}">${this.formatPhone(b.phone)}</a></div>
        ${b.comment ? `<div class="muted">💬 ${b.comment}</div>` : ""}
        <div class="actions">
          ${b.status === "new" ? `<button class="btn small" data-id="${b.id}" data-st="confirmed">Подтвердить</button>` : ""}
          ${b.status === "confirmed" ? `<button class="btn small" data-id="${b.id}" data-st="done">Выполнена</button>` : ""}
          ${(b.status === "new" || b.status === "confirmed") ? `<button class="btn small ghost" data-id="${b.id}" data-st="cancelled">Отменить</button>` : ""}
        </div>
      </div>`).join("");
    document.querySelectorAll("#adminList [data-st]").forEach(btn =>
      btn.addEventListener("click", async () => {
        await this.store.setStatus(btn.dataset.id, btn.dataset.st);
        this.toast("Статус изменён: " + STATUS[btn.dataset.st].text);
        this.loadAdminList();
      }));
  }
};

document.addEventListener("DOMContentLoaded", () => {
  app.init();
  const saved = localStorage.getItem("groom_phone");
  if (saved) $("myPhone").value = "+" + saved;
});

// Регистрация service worker — чтобы приложение можно было установить на телефон
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
