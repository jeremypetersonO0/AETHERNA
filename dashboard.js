import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("AETHERNA JS LOADED")

document.addEventListener("DOMContentLoaded", () => {

/* =========================
   LEVEL SYSTEM
========================= */
let level = 1
let exp = 0
let coins = 0

function expToNextLevel(level) {
return 100 + (level - 1) * 50
}

function formatLevel(num){
return String(num).padStart(2,'0')
}

function normalizeLevel() {
let leveledUp = false
let needed = expToNextLevel(level)

while (exp >= needed) {
exp -= needed
level++
coins += 500
leveledUp = true

console.log("LEVEL UP →", level)
needed = expToNextLevel(level)
}

return leveledUp
}

// Tambahkan async karena fungsi ini akan menyimpan data level baru ke Firebase
async function addExp(amount) {
exp += amount

const leveledUp = normalizeLevel()
if (leveledUp) {
showCoinReward()   // 🔥 animasi coin
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

    // 🔥 Kalau level naik hari ini, catat snapshot level & coin ke history harian.
    // Ini yang dipakai nanti buat ngitung "level up berapa kali minggu ini" di Wrapped.
    if (leveledUp) {
        await logDailyHistory("level", level);
        await logDailyHistory("coins", coins);
    }
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

                // 🔧 PENTING: cek ulang apakah EXP yang tersimpan ini sudah cukup buat naik level.
                // Ini nutup kasus kayak rumus expToNextLevel() diubah lalu ada data lama yang jadi
                // "kelewat" (misal 280 EXP di level 2, padahal kebutuhan levelnya udah turun jadi 150).
                const leveledUpOnLoad = normalizeLevel();
                if (leveledUpOnLoad) {
                    console.log("🎉 Ada level tertunda, diproses saat load. Level sekarang:", level);
                    showCoinReward();
                    await updateDoc(docRef, {
                        level: level,
                        exp: exp,
                        coins: coins
                    }).catch(err => console.error("Gagal simpan koreksi level saat load:", err));
                }

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

// Avatar di dashboard sekarang tinggal menampilkan "screenshot" avatar yang sudah
// jadi (field "snapshot", satu gambar PNG utuh) yang dibuat & disimpan dari AetherPlay.
// Jadi TIDAK perlu lagi mengatur posisi tiap part (mata, rambut, baju, dst) di sini —
// posisinya sudah pas dari sononya karena itu screenshot langsung dari AetherPlay.
async function loadUserAvatarToDashboard(uid) {
    try {
        const docRef = doc(db, "users_avatar", uid);
        const docSnap = await getDoc(docRef);
        const data = docSnap.exists() ? docSnap.data() : null;

        const mainAvatar = document.querySelector(".main-avatar");
        if (!mainAvatar) return;

        if (data && data.snapshot) {
            console.log("🔥 Avatar snapshot ditemukan, menampilkan avatar AetherPlay.");
            mainAvatar.style.backgroundImage = `url('${data.snapshot}')`;
        } else {
            console.log("ℹ️ Avatar belum pernah disimpan di AetherPlay, menampilkan default.");
            mainAvatar.style.backgroundImage = "url('image/aetherplay/avatar/head.png')";
        }

        // Karena sekarang cuma 1 gambar (bukan tumpukan layer lagi), "contain" sudah aman
        mainAvatar.style.backgroundSize = "contain";
        mainAvatar.style.backgroundPosition = "center";
        mainAvatar.style.backgroundRepeat = "no-repeat";
        mainAvatar.style.height = "240px"; // 💡 Naik-turunkan angka ini untuk memperbesar/memperkecil avatar kamu
        mainAvatar.style.width = "100%";
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

            // 3. 🔥 Semua habit (bukan cuma air) sekarang ikut ke-log ke sub-koleksi
            //    history harian, biar Wrapped mingguan punya data lengkap buat direkap.
            if (dbField) {
                await logDailyHistory(dbField, current);
            }

            // 4. Jalankan sistem bonus EXP di paling akhir
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

// 🔥 Catat juga ke history harian biar Wrapped bisa tahu makanan apa
// yang paling sering dipilih user dalam seminggu.
await logDailyHistory("meal_tags", activeTags);

})
})


/* =========================
   WRAPPED SYSTEM (sekarang berbasis data asli user, bukan gambar statis)
========================= */
const modal = document.getElementById("wrappedModal")
const slideContainer = document.getElementById("wrappedSlide")
const playBtn = document.querySelector(".play-btn")
const closeBtn = document.querySelector(".close-btn")

let index = 1
let wrappedSlides = [] // diisi setelah data mingguan diambil & dirangkum
let timer = null

// Bangun konten tiap slide (HTML string) dari hasil rangkuman mingguan.
// Tiap fungsi di sini ganti satu "kartu" gambar statis yang dulu ada.
function buildWrappedSlides(stats) {
const slides = []

slides.push(`
    <div class="wrap-slide-content">
        <h2>This Week in Aetherna 🌿</h2>
        <p>You showed up ${stats.activeDays} out of 7 days. Let's see your recap!</p>
    </div>
`)

slides.push(`
    <div class="wrap-slide-content">
        <h2>🛏️ ${stats.totalSleep} hours</h2>
        <p>Total sleep logged this week</p>
    </div>
`)

slides.push(`
    <div class="wrap-slide-content">
        <h2>🏃 ${stats.totalExercise} minutes</h2>
        <p>Total exercise this week</p>
    </div>
`)

slides.push(`
    <div class="wrap-slide-content">
        <h2>💧 ${stats.totalWater} glasses</h2>
        <p>Water you drank this week</p>
    </div>
`)

slides.push(`
    <div class="wrap-slide-content">
        <h2>🍽️ ${stats.topMealTag ? stats.topMealTag : "No meals logged yet"}</h2>
        <p>${stats.topMealTag ? "Your most logged food this week" : "Start tagging your meals to see this here"}</p>
    </div>
`)

slides.push(
    stats.levelUps > 0
    ? `<div class="wrap-slide-content">
            <h2>🎉 Leveled up x${stats.levelUps}</h2>
            <p>Great progress this week, keep it up!</p>
       </div>`
    : `<div class="wrap-slide-content">
            <h2>💪 Keep going</h2>
            <p>No level up yet this week — you're close!</p>
       </div>`
)

return slides
}

// Bikin ulang jumlah "bar" indikator di atas modal sesuai jumlah slide,
// karena sekarang jumlah slide bisa berubah tergantung data (dulu selalu 6).
function renderIndicatorBars(count) {
const indicator = document.querySelector(".indicator")
if (!indicator) return
indicator.innerHTML = ""
for (let i = 0; i < count; i++) {
const bar = document.createElement("div")
bar.className = "bar"
indicator.appendChild(bar)
}
}

function updateWrappedUI() {
if (!slideContainer || !wrappedSlides.length) return
slideContainer.innerHTML = wrappedSlides[index - 1]

const bars = document.querySelectorAll(".bar")
bars.forEach((b, i) => {
b.classList.toggle("active", i === index - 1)
})
}

async function startWrapped() {
const user = auth.currentUser
if (!user || !slideContainer) return

// Tampilkan status loading dulu selagi data diambil & dirangkum
slideContainer.innerHTML = `<div class="wrap-slide-content"><p>Loading your week...</p></div>`

const days = await getWeeklyHistory(user.uid)
const stats = aggregateWeeklyData(days)
wrappedSlides = buildWrappedSlides(stats)

renderIndicatorBars(wrappedSlides.length)

index = 1
updateWrappedUI()

clearInterval(timer)
timer = setInterval(() => {
index++
if (index > wrappedSlides.length) {
clearInterval(timer)
if (modal) modal.style.display = "none"
return
}
updateWrappedUI()
}, 3000)
}

if (playBtn && modal) {
playBtn.addEventListener("click", async () => {
modal.style.display = "flex"
await startWrapped()
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

// =============================================================================
// LOGGING HARIAN — GENERIC UNTUK SEMUA HABIT (bukan cuma air lagi)
// =============================================================================
// Setiap kali habit di-update, field-nya ditulis ke sub-koleksi
// daily_activities/{uid}/history/{tanggal} pakai merge, jadi tiap hari
// punya satu dokumen berisi semua habit yang di-log hari itu.
// Field "date" sengaja disimpan eksplisit (bukan cuma jadi ID dokumen) supaya
// bisa di-query pakai where("date", ">=", ...) saat ambil rekap mingguan.
async function logDailyHistory(field, value) {
    const user = auth.currentUser;
    if (!user) return;

    const todayStr = getTodayDateString();
    const historyDocRef = doc(db, "daily_activities", user.uid, "history", todayStr);

    await setDoc(historyDocRef, {
        date: todayStr,
        [field]: value
    }, { merge: true }).then(() => {
        console.log(`🚀 History tersimpan: ${field} = ${JSON.stringify(value)} (${todayStr})`);
    }).catch(err => console.error(`Gagal simpan ${field} ke history:`, err));
}

// =============================================================================
// REKAP MINGGUAN — dipakai buat Wrapped
// =============================================================================
// Ambil semua dokumen history 7 hari terakhir (termasuk hari ini).
async function getWeeklyHistory(uid) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 hari lalu + hari ini = 7 hari
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const historyRef = collection(db, "daily_activities", uid, "history");
    const q = query(historyRef, where("date", ">=", sevenDaysAgoStr), orderBy("date", "asc"));

    const days = [];
    try {
        const snap = await getDocs(q);
        snap.forEach(docSnap => days.push(docSnap.data()));
    } catch (err) {
        console.error("Gagal ambil history mingguan:", err);
    }
    return days;
}

// Ubah kumpulan dokumen harian jadi angka rekap yang siap ditampilkan.
function aggregateWeeklyData(days) {
    let totalSleep = 0;
    let totalExercise = 0;
    let totalWater = 0;
    let totalBreaks = 0;
    const mealTagCount = {};
    const levelsSeen = [];

    days.forEach(day => {
        totalSleep += day.sleep_duration || 0;
        totalExercise += day.exercise_duration || 0;
        totalWater += day.water_intake || 0;
        totalBreaks += day.break_count || 0;

        (day.meal_tags || []).forEach(tag => {
            mealTagCount[tag] = (mealTagCount[tag] || 0) + 1;
        });

        if (day.level) levelsSeen.push(day.level);
    });

    let topMealTag = null;
    let topCount = 0;
    for (const tag in mealTagCount) {
        if (mealTagCount[tag] > topCount) {
            topCount = mealTagCount[tag];
            topMealTag = tag;
        }
    }

    const levelUps = levelsSeen.length > 0 ? (levelsSeen[levelsSeen.length - 1] - levelsSeen[0]) : 0;

    return {
        activeDays: days.length,
        totalSleep,
        totalExercise,
        totalWater,
        totalBreaks,
        topMealTag,
        levelUps
    };
}

// Penutup DOMContentLoaded pembungkus utama file dashboard.js
})