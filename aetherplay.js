require('dotenv').config();
import { auth, db } from "./firebase.js"; 
// Samakan semua versinya menjadi 10.12.0
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 1. Fungsi Ganti Mata (Ditempel ke window agar bisa dibaca onclick HTML)
window.changeEyes = function(img) {
    const eyesElement = document.getElementById("eyes");
    if (eyesElement) eyesElement.src = img;
};

// 2. Fungsi Ganti Kategori Tab (Ditempel ke window agar bisa dibaca onclick HTML)
window.showCategory = function(categoryId, element) {
    // Sembunyikan semua konten kategori
    document.querySelectorAll('.category-content').forEach(content => {
        content.style.display = 'none';
    });

    // Tampilkan kategori yang diklik
    const targetCategory = document.getElementById(categoryId);
    if (targetCategory) targetCategory.style.display = 'block';

    // Update status Active pada Tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (element) element.classList.add('active');
};

// 3. Fungsi Perintilan Lainnya (Silakan tambahkan ini juga agar tidak error bergantian)
window.changeNose = function(img) {
    const noseEl = document.getElementById("nose");
    if (noseEl) noseEl.src = img;
};

window.changeMouth = function(img) {
    const mouthEl = document.getElementById("mouth");
    if (mouthEl) mouthEl.src = img;
};

window.changeBlush = function(img) {
    const blush1El = document.getElementById("blush1");
    if (blush1El) blush1El.src = img;
};

window.changeBlush2 = function(img) {
    const blush2El = document.getElementById("blush2");
    if (blush2El) blush2El.src = img;
};

window.changeHair = function(img) {
    const hairEl = document.getElementById("hair");
    if (hairEl) hairEl.src = img;
};

window.changeBaju = function(img) {
    const bajuEl = document.getElementById("baju");
    if (bajuEl) bajuEl.src = img;
};

// Definisikan elemen layer avatar
const layers = {
    eyes: document.getElementById("eyes"),
    nose: document.getElementById("nose"),
    mouth: document.getElementById("mouth"),
    blush1: document.getElementById("blush1"),
    blush2: document.getElementById("blush2"),
    hair: document.getElementById("hair"),
    baju: document.getElementById("baju")
};

// Pastikan fungsi ganti gambar tersedia secara global untuk atribut onclick di HTML
window.changeEyes = (img) => { layers.eyes.src = img; };
window.changeNose = (img) => { if(layers.nose) layers.nose.src = img; };
window.changeMouth = (img) => { layers.mouth.src = img; };
window.changeBlush = (img) => { layers.blush1.src = img; };
window.changeBlush2 = (img) => { layers.blush2.src = img; };
window.changeHair = (img) => { layers.hair.src = img; };
window.changeBaju = (img) => { layers.baju.src = img; };

// Fungsi navigasi tab kategori (global)
window.showCategory = (categoryId, element) => {
    document.querySelectorAll('.category-content').forEach(content => content.style.display = 'none');
    document.getElementById(categoryId).style.display = 'block';
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
};

// Cek status login user & Load data avatar dari DB
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Ambil nama user untuk ditampikan di header
        document.querySelector(".header-right .name").textContent = user.displayName || "User Aetherna";

        const docRef = doc(db, "users_avatar", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Terapkan data yang tersimpan ke asset avatar utama
            if (data.eyes) layers.eyes.src = data.eyes;
            if (data.nose && layers.nose) layers.nose.src = data.nose;
            if (data.mouth) layers.mouth.src = data.mouth;
            if (data.blush1) layers.blush1.src = data.blush1;
            if (data.blush2) layers.blush2.src = data.blush2;
            if (data.hair) layers.hair.src = data.hair;
            if (data.baju) layers.baju.src = data.baju;

            // Pasang avatar mini untuk bagian Header-Right jika diinginkan
            updateHeaderAvatar(data.hair, data.baju);
        }
    } else {
        window.location.href = "login.html"; // Tendang jika belum login
    }
});

// Event klik tombol simpan ke database
document.getElementById("save-avatar-btn").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("Sesi habis, silakan login kembali.");

    const avatarData = {
        eyes: layers.eyes.getAttribute("src"),
        nose: layers.nose ? layers.nose.getAttribute("src") : "",
        mouth: layers.mouth.getAttribute("src"),
        blush1: layers.blush1.getAttribute("src"),
        blush2: layers.blush2.getAttribute("src"),
        hair: layers.hair.getAttribute("src"),
        baju: layers.baju.getAttribute("src"),
        updatedAt: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, "users_avatar", user.uid), avatarData, { merge: true });
        alert("🚀 Avatar dan perintilannya berhasil disimpan ke database!");
        updateHeaderAvatar(avatarData.hair, avatarData.baju);
    } catch (error) {
        console.error("Gagal menyimpan avatar:", error);
        alert("Terjadi kesalahan saat menyimpan data.");
    }
});

// Fungsi opsional untuk menyinkronkan avatar ke badge kecil di kanan atas
function updateHeaderAvatar(hairSrc, bajuSrc) {
    const headerBadge = document.querySelector(".user-avatar");
    if (headerBadge) {
        // Menggunakan teknik tumpukan CSS background-image agar rambut & baju bersatu di lingkaran kecil
        headerBadge.style.backgroundImage = `url('${hairSrc}'), url('${bajuSrc}'), url('image/aetherplay/avatar/head.png')`;
        headerBadge.style.backgroundSize = "cover";
        headerBadge.style.backgroundPosition = "center";
        headerBadge.style.position = "relative";
    }
}