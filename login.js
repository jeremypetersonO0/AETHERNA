import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"; 

const provider = new GoogleAuthProvider();
const form = document.getElementById("loginForm");

// 🔥 FUNGSI LOGIKA TOAST NOTIFIKASI KUSTOM
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  
  // Buat elemen toast baru
  const toast = document.createElement("div");
  toast.classList.add("toast", type);
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // Trigger animasi muncul
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);
  
  // Hilangkan toast setelah 3.5 detik
  setTimeout(() => {
    toast.classList.remove("show");
    // Hapus elemen dari HTML setelah animasi selesai
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}

// Fungsi cek role setelah login sukses
async function checkUserRole(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.role === "admin") {
      showToast("Selamat datang, Admin!", "success");
      setTimeout(() => {
        window.location.href = "dashboard_admin.html";
      }, 1500); 
    } else {
        showToast("Login berhasil!", "success");
        setTimeout(() => {
          window.location.href = "dashborad.html";
        }, 1500);
      }
    } else {
      showToast("Data role tidak ditemukan, masuk sebagai user standar.", "info");
      setTimeout(() => {
        window.location.href = "dashborad.html";
      }, 1500);
    }
  } catch (error) {
    console.error("Gagal mengambil data role:", error);
    showToast("Terjadi kesalahan saat memeriksa database.", "error");
  }
}

// === LOGIN EMAIL & PASSWORD ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector("input[type='email']").value;
  const password = document.querySelector("input[type='password']").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await checkUserRole(userCredential.user);

  } catch (error) {
    console.log(error.code);
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      showToast("Email atau kata sandi tidak cocok", "error");
    } else if (error.code === "auth/invalid-email") {
      showToast("Format email tidak valid", "error");
    } else {
      showToast("Terjadi kesalahan, coba lagi", "error");
    }
  }
});

// === LOGIN GOOGLE SIGN-IN ===
document.getElementById("googleLogin").addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    await checkUserRole(result.user);

  } catch (error) {
    console.log(error.code);
    showToast("Login Google gagal", "error");
  }
});