import { auth, db } from "./firebase.js"; 
// Samakan semua versinya menjadi 10.12.0
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Rumus EXP dibutuhkan per level — HARUS SAMA dengan dashboard.js & profile.html
function expToNextLevel(level) {
    return 100 + (level - 1) * 50;
}

// Ambil level, exp, dan koin dari koleksi "daily_activities" (sumber yang sama dipakai
// dashboard & profile), lalu update teks Level, progress bar EXP, dan jumlah koin
// di panel avatar AetherPlay (sebelumnya level statis "Level 10" & koin statis "500").
async function loadStatsToAetherPlay(uid) {
    try {
        const activitySnap = await getDoc(doc(db, "daily_activities", uid));
        const data = activitySnap.exists() ? activitySnap.data() : {};

        const level = data.level || 1;
        const exp = data.exp || 0;
        const coins = data.coins || 0;
        const needed = expToNextLevel(level);

        const levelText = document.querySelector(".avatar-info p");
        if (levelText) levelText.textContent = `Level ${String(level).padStart(2, '0')}`;

        const progressBar = document.querySelector(".avatar-info .level-bar .progress");
        if (progressBar) progressBar.style.width = Math.min((exp / needed) * 100, 100) + "%";

        const coinText = document.querySelector(".coin-amount");
        if (coinText) coinText.textContent = coins;
    } catch (err) {
        console.error("Gagal memuat level & koin ke AetherPlay:", err);
    }
}

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

        // Sinkronkan level, EXP, dan koin (sebelumnya statis "Level 10" & koin "500")
        loadStatsToAetherPlay(user.uid);

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
        // Gabungkan semua layer jadi satu gambar PNG dulu ("screenshot" avatar)
        avatarData.snapshot = await generateAvatarSnapshot(avatarData);

        await setDoc(doc(db, "users_avatar", user.uid), avatarData, { merge: true });
        showAetherToast("🚀 Avatar berhasil disimpan!");
    } catch (error) {
        console.error("Gagal menyimpan avatar:", error);
        showAetherToast("Gagal menyimpan avatar. Coba lagi ya.", "error");
    }
});

// Konfigurasi posisi tiap layer avatar — DIAMBIL PERSIS dari aturan CSS di aetherplay.css
// (.layer { width:80% } + #id { transform: scale(x); top: y%; left: z%; }).
// left default 50% kecuali disebutkan lain (blush1/blush2).
const LAYER_LAYOUT = [
    // urutan dari BELAKANG ke DEPAN, hasil sorting z-index CSS-nya (lalu urutan DOM utk z-index sama)
    { getSrc: () => "image/aetherplay/avatar/head.png",                         top: 45,  left: 50, scale: 0.79 }, // z2
    { getSrc: (d) => d.hair  || "image/aetherplay/rambut/Hair2.png",             top: 57,  left: 50, scale: 1.1  }, // z2
    { getSrc: () => "image/aetherplay/avatar/body.png",                         top: 87,  left: 50, scale: 1.0  }, // z3
    { getSrc: () => "image/aetherplay/avatar/celana_default.png",               top: 100, left: 50, scale: 0.40 }, // z3
    { getSrc: (d) => d.baju  || "image/aetherplay/avatar/baju_default.png",      top: 87,  left: 50, scale: 0.88 }, // z4
    { getSrc: (d) => d.eyes  || "image/aetherplay/avatar/mata_default.png",      top: 45,  left: 50, scale: 0.55 }, // z5
    { getSrc: (d) => d.nose  || "image/aetherplay/avatar/hidung_default.png",    top: 50,  left: 50, scale: 0.1  }, // z5
    { getSrc: (d) => d.mouth || "image/aetherplay/avatar/mulut_default.png",     top: 59,  left: 50, scale: 0.2  }, // z5
    { getSrc: (d) => d.blush1|| "image/aetherplay/avatar/blush_1.png",           top: 54,  left: 32, scale: 0.1  }, // z5
    { getSrc: (d) => d.blush2|| "image/aetherplay/avatar/blush_1.png",           top: 54,  left: 67, scale: 0.1  }, // z5
];

const LAYER_BASE_WIDTH_PERCENT = 0.8; // dari .layer { width: 80% }

// Bantu load 1 gambar sebagai Promise (buat digambar ke canvas)
function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
        if (!src) return reject(new Error("src kosong"));
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Gagal load gambar: " + src));
        img.src = src;
    });
}

// "Screenshot" avatar: gambar tiap layer di posisi & ukuran PERSIS sama seperti
// tampilannya di #avatar-box (aetherplay.css), lalu digabung jadi SATU gambar PNG
// lewat <canvas>. Hasilnya disimpan sebagai field "snapshot" di Firestore, jadi
// dashboard tinggal tampilkan 1 gambar ini apa adanya — tidak perlu atur posisi lagi.
async function generateAvatarSnapshot(avatarData) {
    // Pakai rasio avatar-box asli (~310 x 350), di-2x-kan biar hasil PNG lebih tajam
    const CANVAS_W = 620;
    const CANVAS_H = 700;

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");

    for (const layer of LAYER_LAYOUT) {
        const src = layer.getSrc(avatarData);
        if (!src) continue;

        try {
            const img = await loadImageAsync(src);

            const boxW = CANVAS_W * LAYER_BASE_WIDTH_PERCENT * layer.scale;
            const boxH = boxW * (img.naturalHeight / img.naturalWidth); // jaga rasio asli gambar

            const centerX = CANVAS_W * (layer.left / 100);
            const centerY = CANVAS_H * (layer.top / 100);

            const drawX = centerX - boxW / 2;
            const drawY = centerY - boxH / 2;

            ctx.drawImage(img, drawX, drawY, boxW, boxH);
        } catch (err) {
            console.warn(err.message);
        }
    }

    return canvas.toDataURL("image/png");
}
// Notifikasi kustom pengganti alert() bawaan browser (yang muncul di atas & kaku).
// Muncul di pojok kanan bawah, auto-hilang sendiri.
function showAetherToast(message, type = "success") {
    let toast = document.getElementById("aether-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "aether-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            max-width: 320px;
            padding: 14px 20px;
            border-radius: 12px;
            color: #fff;
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            z-index: 99999;
            opacity: 0;
            transform: translateY(16px);
            transition: opacity 0.25s ease, transform 0.25s ease;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }

    toast.style.background = type === "error" ? "#e74c3c" : "#6c5ce7";
    toast.textContent = message;

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(16px)";
    }, 2600);
}