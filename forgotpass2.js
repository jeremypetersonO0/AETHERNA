import { auth } from "./firebase.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const email = localStorage.getItem("resetEmail");

const btn = document.getElementById("resendBtn");

let timeLeft = 60;

// countdown
const timer = setInterval(() => {
  timeLeft--;
  btn.textContent = `Resend link in ${timeLeft}s`;

  if (timeLeft <= 0) {
    clearInterval(timer);
    btn.disabled = false;
    btn.textContent = "Resend link";
  }
}, 1000);

// klik resend
btn.addEventListener("click", async () => {
  try {
    btn.disabled = true;
    btn.textContent = "Sending...";

    await sendPasswordResetEmail(auth, email);

    alert("Reset link dikirim ulang!");

    // reset timer lagi
    timeLeft = 60;
    btn.textContent = "Resend link in 60s";

    const newTimer = setInterval(() => {
      timeLeft--;
      btn.textContent = `Resend link in ${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(newTimer);
        btn.disabled = false;
        btn.textContent = "Resend link";
      }
    }, 1000);

  } catch (error) {
    console.log(error.code);
    alert("Gagal kirim ulang email");
  }
});