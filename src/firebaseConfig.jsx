// firebaseConfig.jsx
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDXW3F1pQM54Equ1J-yav4KBJzRvZ7dILA",
  authDomain: "agendamento-de-vtrs.firebaseapp.com",
  projectId: "agendamento-de-vtrs",
  storageBucket: "agendamento-de-vtrs.firebasestorage.app",
  messagingSenderId: "744628319527",
  appId: "1:744628319527:web:71602f6035d215525a2502",
  measurementId: "G-YQE50QTEZX",
};

const app = initializeApp(firebaseConfig);

export default app;
