// 1. Import layanan Auth dan Firestore dari file konfigurasi pusat
import { auth, db } from "./firebase.js";

// 2. Import method fungsional dari Firebase SDK
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const dailyForm = document.getElementById('dailyForm');

// Pantau status login user secara real-time
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userUID = user.uid;
    console.log("Sesi aktif terdeteksi di setup2! UID:", userUID);

    // Tangani event submit form saat tombol Next diklik
    dailyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Mengambil semua input bertipe number di dalam form berdasarkan urutan kartu
      const numberInputs = dailyForm.querySelectorAll("input[type='number']");
      const sleepHours = numberInputs[0].value;  // Kartu 1: Sleep
      const moveMinutes = numberInputs[1].value; // Kartu 2: Move
      const waterGlasses = numberInputs[2].value; // Kartu 3: Water

      try {
        console.log("Sedang menyimpan data ke daily_activities...");

        // Menambahkan dokumen baru ke dalam koleksi 'daily_activities'
        await addDoc(collection(db, "daily_activities"), {
          // Data dinamis dari inputan HTML
          sleep_duration: Number(sleepHours),
          exercise_duration: Number(moveMinutes),
          water_intake: Number(waterGlasses),
          
          // Data identitas dan waktu (Sesuai format databasemu)
          userID: userUID, 
          log_date: new Date(), 

          // Nilai default untuk field awal lainnya
          break_count: 0,
          daily_status: 1,
          food_quality: "Good",
          food_score: 0.0,
          is_sedentary: true
        });

        console.log("Data harian default berhasil dibuat di Firestore!");
        
        // Pindah ke halaman setup selanjutnya setelah data sukses masuk
        window.location.href = 'setup3.html';

      } catch (error) {
        console.error("Error saat menyimpan ke Firestore:", error);
        alert("Gagal menyimpan data harian: " + error.message);
      }
    });

  } else {
    console.warn("Tidak ada user aktif.");
    alert("Silakan sign up terlebih dahulu.");
    window.location.href = 'sign-up.html';
  }
});