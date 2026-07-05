import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("AETHERNA JS LOADED")

document.addEventListener("DOMContentLoaded", () => {

/* =========================
   LEVEL SYSTEM
========================= */
let level = 1
let exp = 0
let coins = 0

function expToNextLevel(level) {
return level * 200
}

function formatLevel(num){
return String(num).padStart(2,'0')
}

// Tambahkan async karena fungsi ini akan menyimpan data level baru ke Firebase
async function addExp(amount) {
exp += amount
let needed = expToNextLevel(level)

while (exp >= needed) {
exp -= needed
level++
coins += 500

showCoinReward()   // 🔥 animasi coin
updateCoinUI()

console.log("LEVEL UP →", level)
needed = expToNextLevel(level)
}

updateLevelUI()
updateCoinUI()

// Sinkronisasikan Level, EXP, dan Coin terbaru ke database setelah bertambah
const user = auth.currentUser;
if (user) {
    await updateDoc(doc(db, "daily_activities", user.uid), {
        level: level,
        exp: exp,
        coins: coins
    }).catch(err => console.error("Gagal simpan progress level:", err));
}
}

function updateLevelUI() {
const levelTexts = document.querySelectorAll(".level")
const progress = document.querySelector(".progress-fill")
const expText = document.querySelector(".exp-text")

let needed = expToNextLevel(level)

levelTexts.forEach(el => {
el.textContent = "Level " + formatLevel(level)
})

if(progress){
progress.style.width = (exp / needed) * 100 + "%"
}

if(expText){
expText.textContent = `${exp} / ${needed} EXP`
}
}


/* =========================
   FIREBASE REALTIME LOAD & DAILY RESET SYSTEM
========================= */
// Mendapatkan tanggal hari ini dengan format YYYY-MM-DD
function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Mengisi data dari database ke UI Dashboard saat user login
function renderDataToUI(field, val) {
    const item = document.querySelector(`[data-db="${field}"]`);
    if (!item) return;
    
    const num = item.querySelector(".number");
    const bar = item.querySelector(".habit-progress");
    const max = Number(item.dataset.max);

    if (num) num.textContent = val;
    if (bar) bar.style.width = (val / max) * 100 + "%";
    if (val >= max) item.dataset.done = "true";
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User terautentikasi:", user.uid);

        await loadUserAvatarToDashboard(user.uid);
        
        // 📄 KONEKSI 1: Ambil data aktivitas harian, level, exp, dan koin
        const docRef = doc(db, "daily_activities", user.uid);
        
        // 📄 KONEKSI 2: Ambil data nama kustom dan foto dari koleksi profiles
        const profileRef = doc(db, "profiles", user.uid);

        try {
            // Tarik data profil (Nama & Avatar) terlebih dahulu
            const profileSnap = await getDoc(profileRef);
            let currentUsername = "User";
            
            if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                currentUsername = profileData.name || "User";
                
                // Pasang foto profil ke user-avatar di header dashboard jika ada
                if (profileData.avatar) {
                    const avatarDiv = document.querySelector(".user-avatar");
                    if (avatarDiv) {
                        avatarDiv.style.backgroundImage = `url(${profileData.avatar})`;
                        avatarDiv.style.backgroundSize = "cover";
                        avatarDiv.style.backgroundPosition = "center";
                    }
                }
            }

            // Pasang nama ke badge header kanan atas dan banner video promo harian
            const nameBadge = document.querySelector(".user-badge .name");
            if (nameBadge) nameBadge.textContent = currentUsername;
            
            const promoHeading = document.querySelector(".video-promo h2");
            if (promoHeading) promoHeading.textContent = `Hey, ${currentUsername}!`;


            // --- LANJUTAN LOGIKA BAWAAN DASHBOARD JS KAMU ---
            const docSnap = await getDoc(docRef);
            const todayStr = getTodayDateString();

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Ambil data level permanen
                level = data.level || 1;
                exp = data.exp || 0;
                coins = data.coins || 0;
                updateLevelUI();
                updateCoinUI();

                // KONDISI DAILY RESET
                if (data.last_active_date !== todayStr) {
                    console.log("Hari baru terdeteksi! Reset aktivitas harian...");
                    await updateDoc(docRef, {
                        sleep_duration: 0,
                        exercise_duration: 0,
                        water_intake: 0,
                        break_count: 0,
                        meal_tags: [],
                        last_active_date: todayStr
                    });

                    renderDataToUI("sleep_duration", 0);
                    renderDataToUI("exercise_duration", 0);
                    renderDataToUI("water_intake", 0);
                    renderDataToUI("break_count", 0);
                } else {
                    renderDataToUI("sleep_duration", data.sleep_duration || 0);
                    renderDataToUI("exercise_duration", data.exercise_duration || 0);
                    renderDataToUI("water_intake", data.water_intake || 0);
                    renderDataToUI("break_count", data.break_count || 0);

                    if (data.meal_tags && Array.isArray(data.meal_tags)) {
                        document.querySelectorAll(".tag").forEach(tag => {
                            if (data.meal_tags.includes(tag.innerText.trim())) {
                                tag.classList.add("active");
                            }
                        });
                    }
                }
            } else {
                console.log("Dokumen user baru dibuat.");
                await setDoc(docRef, {
                    sleep_duration: 0, exercise_duration: 0, water_intake: 0, break_count: 0,
                    meal_tags: [], level: 1, exp: 0, coins: 0, last_active_date: todayStr
                });
                updateLevelUI();
                updateCoinUI();
            }
        } catch (error) {
            console.error("Gagal memuat data Firebase:", error);
        }
    } else {
        console.log("No user logged in, redirecting...");
        window.location.href = "login.html";
    }
});

async function loadUserAvatarToDashboard(uid) {
    try {
        const docRef = doc(db, "users_avatar", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("🔥 DATA AVATAR BERHASIL DIAMBIL:", data);
            
            // 1. UPDATE AVATAR KECIL DI POJOK KANAN ATAS (HEADER)
            const headerAvatar = document.querySelector(".user-avatar");
            if (headerAvatar) {
                headerAvatar.style.backgroundImage = `url('${data.hair}'), url('${data.baju}'), url('image/aetherplay/avatar/head.png')`;
                headerAvatar.style.backgroundSize = "cover";
                headerAvatar.style.backgroundPosition = "center";
                headerAvatar.style.borderRadius = "50%";
            }

            // 2. UPDATE AVATAR BESAR DI TENGAH DASHBOARD (DENGAN UKURAN PRESISI)
            const mainAvatar = document.querySelector(".main-avatar");
            if (mainAvatar) {
                mainAvatar.style.backgroundImage = `url('${data.hair}'), url('${data.baju}'), url('image/aetherplay/avatar/head.png')`;
                
                // 🔥 KUNCI UKURAN: Berikan perintah 'contain' ke 3 layer (Rambut, Baju, Kepala) secara berurutan
                mainAvatar.style.backgroundSize = "contain, contain, contain";
                
                // 🔥 KUNCI POSISI: Pastikan semua layer sejajar tepat di tengah kotak
                mainAvatar.style.backgroundPosition = "center, center, center";
                mainAvatar.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat";
                
                // Atur ukuran kotak div-nya agar stabil
                mainAvatar.style.height = "240px"; // 💡 Naik-turunkan angka ini untuk memperbesar/memperkecil avatar kamu
                mainAvatar.style.width = "100%";
            }
            
        } else {
            console.log("ℹ️ Avatar belum dibuat di AetherPlay, menampilkan default.");
            // Jika data belum ada, pasang gambar default di tengah
            const mainAvatar = document.querySelector(".main-avatar");
            if (mainAvatar) {
                mainAvatar.style.backgroundImage = "url('Default Character.png')";
                mainAvatar.style.backgroundSize = "contain";
                mainAvatar.style.backgroundRepeat = "no-repeat";
                mainAvatar.style.backgroundPosition = "center";
                mainAvatar.style.height = "250px";
            }
        }
    } catch (err) {
        console.error("Gagal memuat avatar:", err);
    }
}

/* =========================
   HABIT SYSTEM + EXP + FIREBASE SINKRONISASI
========================= */
document.querySelectorAll(".plus").forEach(btn => {
    const newBtn = btn.cloneNode(true)
    btn.parentNode.replaceChild(newBtn, btn)

    newBtn.addEventListener("click", async function (e) {
        e.preventDefault()

        const user = auth.currentUser;
        if (!user) return;

        const item = this.closest(".habit-item")
        const num = item.querySelector(".number")
        const bar = item.querySelector(".habit-progress")
        const dbField = item.getAttribute("data-db") 

        let max = Number(item.dataset.max)
        let current = Number(num.textContent)

        if (isNaN(current)) current = 0

        if (current < max) {
            current++
            // 1. Update UI angka dan progress bar terlebih dahulu
            num.textContent = current
            if (bar) bar.style.width = (current / max) * 100 + "%"

            // 2. Kirim data ke dokumen utama daily_activities
            if (dbField) {
                await updateDoc(doc(db, "daily_activities", user.uid), {
                    [dbField]: current
                }).catch(err => console.error("Gagal sinkronisasi habit:", err));
            }

            // 3. 🔥 PENTING: Jika yang diklik adalah air minum, langsung tembak ke sub-koleksi history harian!
            if (dbField === "water_intake") {
                await addWater(current); 
            }

            // 4. Jalankan sistem bonus EXP di paling akhir agar tidak memblokir fungsi addWater()
            if (current === max && !item.dataset.done) {
                item.dataset.done = "true"
                await addExp(60)
                console.log("TASK COMPLETE +60 EXP")
            }
        }
    })
})


/* =========================
   TAG SYSTEM + FIREBASE SINKRONISASI
========================= */
document.querySelectorAll(".tag").forEach(tag => {
tag.addEventListener("click", async () => {
tag.classList.toggle("active")

const user = auth.currentUser;
if (!user) return;

// Cari semua komponen tag yang sedang aktif di UI
const activeTags = [];
document.querySelectorAll(".tag.active").forEach(t => {
    activeTags.push(t.innerText.trim());
});

// 🔥 SINKRONISASI ARRAY TAG MAKANAN KE FIRESTORE
await updateDoc(doc(db, "daily_activities", user.uid), {
    meal_tags: activeTags
}).catch(err => console.error("Gagal simpan tag makanan:", err));

})
})


/* =========================
   WRAPPED SYSTEM
========================= */
const modal = document.getElementById("wrappedModal")
const img = document.getElementById("wrappedImage")
const bars = document.querySelectorAll(".bar")
const playBtn = document.querySelector(".play-btn")
const closeBtn = document.querySelector(".close-btn")

let index = 1
const max = 6
let timer = null

function updateWrappedUI() {
if (!img) return
img.src = `wrapped_${index}.png`
bars.forEach((b, i) => {
b.classList.toggle("active", i === index - 1)
})
}

function startWrapped() {
index = 1
updateWrappedUI()
clearInterval(timer)
timer = setInterval(() => {
index++
if (index > max) {
clearInterval(timer)
if (modal) modal.style.display = "none"
return
}
updateWrappedUI()
}, 3000)
}

if (playBtn && modal) {
playBtn.addEventListener("click", () => {
modal.style.display = "flex"
startWrapped()
})
}

if (closeBtn && modal) {
closeBtn.addEventListener("click", () => {
modal.style.display = "none"
clearInterval(timer)
})
}

if (modal) {
modal.addEventListener("click", (e) => {
if (e.target === modal) {
modal.style.display = "none"
clearInterval(timer)
}
})
}

function updateCoinUI(){
const coinText = document.querySelector(".coin-value")
if(coinText){
coinText.textContent = coins
}
}

// Fungsi duplikat showCoinReward() pertama dihapus otomatis oleh sistem pembacaan JS

function showCoinReward(){
const float = document.querySelector(".coin-float")
if(!float) return
float.classList.add("show")
setTimeout(()=>{
float.classList.remove("show")
},1200)
}

let totalWater = localStorage.getItem("totalWater") || 0;

// Mengganti fungsi localStorage air minum lama di dashboard.js agar menembak ke sub-koleksi histori tanggal hari ini
// =============================================================================
// FUNGSI AKHIR FILE: MANAGEMENT SINKRONISASI AIR KE FIRESTORE HISTORY
// =============================================================================

async function addWater(currentWaterValue) { 
    const user = auth.currentUser;
    if (!user) return;

    const todayStr = getTodayDateString();

    // Jika fungsi dipanggil tanpa parameter (misalnya saat load awal), baru baca dari UI
    if (currentWaterValue === undefined) {
        const habitItem = document.querySelector('[data-db="water_intake"]');
        if (!habitItem) return;
        currentWaterValue = Number(habitItem.querySelector(".number").textContent) || 0;
    }

    // Masuk ke sub-koleksi history harian
    const historyDocRef = doc(db, "daily_activities", user.uid, "history", todayStr);
    
    await setDoc(historyDocRef, {
        water_intake: currentWaterValue
    }, { merge: true }).then(() => {
        console.log(`🚀 DATA MASUK: Berhasil mencatat ${currentWaterValue} gelas ke history.`);
    }).catch(err => console.error("Gagal simpan akumulasi air ke history:", err));
}

// Penutup DOMContentLoaded pembungkus utama file dashboard.js
})

