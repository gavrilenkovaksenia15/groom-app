// ===== Настройки приложения =====
// 1. Настройки вашего проекта Firebase
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAhs1RYoObepnwonTG32DfCAQyw6ZX_2xw",
  authDomain: "groom-app-5bbbf.firebaseapp.com",
  projectId: "groom-app-5bbbf",
  storageBucket: "groom-app-5bbbf.firebasestorage.app",
  messagingSenderId: "816779456717",
  appId: "1:816779456717:web:ade33f0e546ef68453f984"
};

// 2. Настройки салона
const SALON = {
  name: "Пушистый стиль",
  address: "г. Москва, ул. Садовая, д. 10",
  phone: "+7 (900) 123-45-67",
  workStart: 10,      // начало рабочего дня (час)
  workEnd: 19,        // конец рабочего дня (час)
  daysAhead: 14,      // на сколько дней вперёд можно записаться
  dayOff: [1],        // выходные дни недели: 0 - вс, 1 - пн и т.д.
  groomerPin: "1234"  // PIN-код для входа грумера
};

// ===== Инициализация Firebase =====
// Проверяем, загрузились ли библиотеки Firebase
if (typeof firebase !== 'undefined') {
  // Инициализируем приложение с нашими ключами
  firebase.initializeApp(FIREBASE_CONFIG);
  
  // Создаем глобальную переменную db для работы с Firestore
  window.db = firebase.firestore();
  
  console.log("Firebase успешно подключен!");
} else {
  console.warn("Firebase SDK не загружен. Приложение работает в демо-режиме (данные в памяти).");
}