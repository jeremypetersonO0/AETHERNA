// 1. Import layanan Auth dan Firestore langsung dari file firebase.js kita
import { auth, db } from "./firebase.js";

// 2. Import method fungsional dari Firebase SDK
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const profileForm = document.getElementById('profileForm');

// Pantau status login user secara real-time
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userUID = user.uid;
    console.log("Sesi aktif terdeteksi di setup! UID:", userUID);

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('profileName').value;
      const weight = document.getElementById('profileWeight').value;
      const height = document.getElementById('profileHeight').value; // Sesuai id HTML kamu nanti

      try {
        console.log("Sedang mencoba menyimpan data ke Firestore...");
        
        // Simpan data dengan ID dokumen = UID user
        const docRef = doc(db, "profiles", userUID);
        await setDoc(docRef, {
          name: name,
          weight: Number(weight),
          height: Number(height),
          updatedAt: new Date()
        });

        console.log("Data BERHASIL masuk ke Firestore database!");
        alert("Profil berhasil disimpan!");
        window.location.href = 'setup2.html';

      } catch (error) {
        console.error("Error Firestore detail:", error);
        alert("Gagal menyimpan profil: " + error.message);
      }
    });

  } else {
    console.warn("Tidak ada user yang aktif login.");
    alert("Silakan sign up atau login terlebih dahulu.");
    window.location.href = 'sign-up.html';
  }
});