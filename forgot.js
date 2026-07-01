import { auth } from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById("forgotForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("input[type='email']").value;

  try {
    await sendPasswordResetEmail(auth, email);

    alert("Link reset password sudah dikirim ke email kamu!");
    window.location.href = "forgotpass2.html";

    // 👉 SIMPAN EMAIL KE LOCALSTORAGE
    localStorage.setItem("resetEmail", email);

    window.location.href = "forgotpass2.html";

  } catch (error) {
    console.log(error.code);

    if (error.code === "auth/user-not-found") {
      alert("Email tidak terdaftar");
    } else if (error.code === "auth/invalid-email") {
      alert("Format email tidak valid");
    } else {
      alert("Gagal mengirim reset email");
    }
  }
});