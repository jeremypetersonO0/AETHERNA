import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const provider = new GoogleAuthProvider();

const form = document.getElementById("loginForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("input[type='email']").value;
  const password = document.querySelector("input[type='password']").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    alert("Login berhasil!");
    window.location.href = "dashborad.html";

  }  catch (error) {
  console.log(error.code);

  if (
    error.code === "auth/invalid-credential" ||
    error.code === "auth/wrong-password" ||
    error.code === "auth/user-not-found"
  ) {
    alert("Email atau kata sandi tidak cocok");
  } else if (error.code === "auth/invalid-email") {
    alert("Format email tidak valid");
  } else {
    alert("Terjadi kesalahan, coba lagi");
  }
}
});

document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    console.log("Google user:", user);

    alert("Login Google berhasil!");
    window.location.href = "dashboard.html";

  } catch (error) {
    console.log(error.code);
    alert("Login Google gagal");
  }
});