import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqzoLRsEXrjTPFw_Cin5bcDdQZlOD4das",
  authDomain: "aetherna-b1376.firebaseapp.com",
  projectId: "aetherna-b1376",
  storageBucket: "aetherna-b1376.firebasestorage.app",
  messagingSenderId: "248543593062",
  appId: "1:248543593062:web:d8bd91f42783fc2920e3a7",
  measurementId: "G-LQBN22M607"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);