// ===== Расписание: свободные дни и часы =====
class Schedule {
  constructor(settings, store) {
    this.s = settings;
    this.store = store;
  }

  // Дата в формате "ГГГГ-ММ-ДД"
  static toKey(d) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  // Список рабочих дней, на которые можно записаться
  getWorkDays() {
    const days = [];
    const today = new Date();
    for (let i = 0; i < this.s.daysAhead; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      if (!this.s.dayOff.includes(d.getDay())) days.push(d);
    }
    return days;
  }

  // Свободные часы на дату для услуги длительностью hours
  async getFreeSlots(date, hours) {
    const bookings = await this.store.getByDate(date);
    const busy = new Set();
    bookings
      .filter(b => b.status !== "cancelled")
      .forEach(b => { for (let h = 0; h < b.hours; h++) busy.add(b.time + h); });

    const now = new Date();
    const isToday = date === Schedule.toKey(now);
    const free = [];
    for (let t = this.s.workStart; t + hours <= this.s.workEnd; t++) {
      if (isToday && t <= now.getHours()) continue;   // прошедшее время сегодня
      let ok = true;
      for (let h = 0; h < hours; h++) if (busy.has(t + h)) ok = false;
      if (ok) free.push(t);
    }
    return free;
  }
}
