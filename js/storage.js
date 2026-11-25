// ===== Хранение данных =====
// Класс "Запись на услугу"
class Booking {
  constructor(data) {
    this.id = data.id || "";
    this.serviceId = data.serviceId;
    this.serviceName = data.serviceName;
    this.price = data.price;
    this.hours = data.hours;
    this.date = data.date;          // "2026-11-25"
    this.time = data.time;          // число: час начала, например 12
    this.petName = data.petName;
    this.petType = data.petType;    // "Собака" / "Кошка"
    this.petBreed = data.petBreed || "";
    this.ownerName = data.ownerName;
    this.phone = data.phone;        // только цифры
    this.comment = data.comment || "";
    this.status = data.status || "new"; // new, confirmed, done, cancelled
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toObject() {
    const o = Object.assign({}, this);
    delete o.id;
    return o;
  }
}

// Хранилище в памяти браузера (демо-режим)
class LocalStore {
  constructor() { this.key = "groom_bookings"; }

  _all() {
    try { return JSON.parse(localStorage.getItem(this.key)) || []; }
    catch (e) { return []; }
  }
  _save(list) { localStorage.setItem(this.key, JSON.stringify(list)); }

  async add(booking) {
    const list = this._all();
    booking.id = "b" + Date.now();
    list.push(Object.assign({ id: booking.id }, booking.toObject()));
    this._save(list);
    return booking.id;
  }
  async getByDate(date) {
    return this._all().filter(b => b.date === date).map(b => new Booking(b));
  }
  async getByPhone(phone) {
    return this._all().filter(b => b.phone === phone).map(b => new Booking(b));
  }
  async setStatus(id, status) {
    const list = this._all();
    const b = list.find(x => x.id === id);
    if (b) { b.status = status; this._save(list); }
  }
}

// Хранилище в облаке Firebase Firestore
class FirebaseStore {
  constructor(config) {
    firebase.initializeApp(config);
    this.col = firebase.firestore().collection("bookings");
  }
  async add(booking) {
    const ref = await this.col.add(booking.toObject());
    return ref.id;
  }
  async getByDate(date) {
    const snap = await this.col.where("date", "==", date).get();
    return snap.docs.map(d => new Booking(Object.assign({ id: d.id }, d.data())));
  }
  async getByPhone(phone) {
    const snap = await this.col.where("phone", "==", phone).get();
    return snap.docs.map(d => new Booking(Object.assign({ id: d.id }, d.data())));
  }
  async setStatus(id, status) {
    await this.col.doc(id).update({ status: status });
  }
}

// Выбираем хранилище: облако, если заданы настройки Firebase, иначе демо-режим
function createStore() {
  if (FIREBASE_CONFIG.apiKey && typeof firebase !== "undefined") {
    try { return { store: new FirebaseStore(FIREBASE_CONFIG), online: true }; }
    catch (e) { console.log("Firebase не запустился:", e); }
  }
  return { store: new LocalStore(), online: false };
}
