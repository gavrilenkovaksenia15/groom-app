// ===== Справочник услуг =====
// Класс "Услуга"
class Service {
  constructor(id, name, description, price, hours, icon) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;   // цена в рублях
    this.hours = hours;   // длительность в часах
    this.icon = icon;
  }
}

const SERVICES = [
  new Service("wash", "Мытьё и сушка", "Мытьё шампунем, бальзам, сушка феном, расчёсывание", 1500, 1, "🛁"),
  new Service("haircut", "Модельная стрижка", "Стрижка по стандарту породы или по желанию владельца", 2500, 2, "✂️"),
  new Service("hygiene", "Гигиенический уход", "Стрижка когтей, чистка ушей, обработка лап", 900, 1, "🐾"),
  new Service("complex", "Комплекс «Всё включено»", "Мытьё, стрижка, когти, уши и ароматный спрей", 3800, 2, "⭐"),
  new Service("cat", "Уход за кошкой", "Вычёсывание подшёрстка, мытьё, стрижка когтей", 2200, 1, "🐱")
];

function findService(id) {
  return SERVICES.find(s => s.id === id);
}
