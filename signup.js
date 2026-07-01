import { auth } from "./firebase.js";
import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// =======================
// GOOGLE PROVIDER (buat sekali saja)
// =======================
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account"
});

// =======================
// EMAIL SIGN UP
// =======================
const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("input[type='email']").value;
  const password = document.querySelector("input[type='password']").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    alert("Sign up berhasil!");
    window.location.href = "setup.html";

  } catch (error) {
    console.log(error.code);
    console.log(error.message);

    if (error.code === "auth/email-already-in-use") {
      alert("Email sudah dipakai, coba login atau pakai email lain.");
    } else if (error.code === "auth/invalid-email") {
      alert("Format email tidak valid.");
    } else if (error.code === "auth/weak-password") {
      alert("Password terlalu lemah (minimal 6 karakter).");
    } else {
      alert("Error: " + error.message);
    }
  }
});

// =======================
// GOOGLE SIGN UP
// =======================
document.getElementById("googleSignup").addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const result = await signInWithPopup(auth, provider);

    console.log(result.user);

    alert("Google sign up berhasil!");
    window.location.href = "setup.html";

  } catch (error) {
    console.log(error.code);

    if (error.code === "auth/popup-closed-by-user") {
      alert("Popup ditutup sebelum selesai login.");
    } else if (error.code === "auth/cancelled-popup-request") {
      alert("Popup dibatalkan, coba klik lagi.");
    } else {
      alert("Google sign up gagal: " + error.code);
    }
  }
});