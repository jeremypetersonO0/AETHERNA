import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// Menggunakan doc dan setDoc dengan merge: true agar melengkapi data profil sebelumnya
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const goalsForm = document.getElementById('goalsForm');

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userUID = user.uid;
    console.log("Sesi aktif terdeteksi di setup3! UID:", userUID);

    goalsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 1. Ambil nilai Radio Button yang dipilih (Activity Level)
      const selectedActivity = goalsForm.querySelector("input[name='activity']:checked").value;

      // 2. Ambil nilai Checkbox yang dicentang (Goals) -> Masukkan ke dalam Array
      const checkedGoals = [];
      const goalCheckboxes = goalsForm.querySelectorAll("input[name='goals']:checked");
      goalCheckboxes.forEach((cb) => {
        checkedGoals.push(cb.value);
      });

      try {
        console.log("Sedang memperbarui profil dengan data vibes & goals...");

        const docRef = doc(db, "profiles", userUID);
        
        // { merge: true } memastikan data name, height, weight sebelumnya TIDAK terhapus
        await setDoc(docRef, {
          activityLevel: selectedActivity,
          goals: checkedGoals, // Isinya berupa array, contoh: ["Feel healthier", "Get stronger"]
          setupCompleted: true, // Flag opsional penanda user sudah selesai onboarding
          updatedAt: new Date()
        }, { merge: true });

        console.log("Data goals berhasil digabungkan ke profil!");
        
        // Alihkan langsung ke dashboard utama (sesuai typo href di file HTML kamu: dashborad.html)
        window.location.href = 'dashborad.html'; 

      } catch (error) {
        console.error("Error Firestore setup3:", error);
        alert("Gagal menyimpan preferensi: " + error.message);
      }
    });

  } else {
    console.warn("Tidak ada user aktif.");
    alert("Silakan sign up terlebih dahulu.");
    window.location.href = 'sign-up.html';
  }
});