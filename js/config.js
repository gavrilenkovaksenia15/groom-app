// ===== Настройки приложения =====
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAhs1RYoObepnwonTG32DfCAQyw6ZX_2xw",
  authDomain: "groom-app-5bbbf.firebaseapp.com",
  projectId: "groom-app-5bbbf",
  storageBucket: "groom-app-5bbbf.firebasestorage.app",
  messagingSenderId: "816779456717",
  appId: "1:816779456717:web:ade33f0e546ef68453f984"
};

const SALON = {
  name: "Пушистый стиль",
  address: "г. Москва, ул. Садовая, д. 10",
  phone: "+7 (900) 123-45-67",
  workStart: 10,
  workEnd: 19,
  daysAhead: 14,
  dayOff: [1],
  groomerPin: "1234"
};

if (typeof firebase !== 'undefined') {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.db = firebase.firestore();
  console.log("Firebase успешно подключен!");
} else {
  console.warn("Firebase SDK не загружен. Работаем в демо-режиме.");
}
