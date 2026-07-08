import { auth, db } from "./firebase.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// State Global UID User yang sedang aktif login
let currentLoggedUID = null;

// Rumus konversi ambang batas kenaikan level EXP
function expToNextLevel(level) {
    return 100 + (level - 1) * 50;
}

// 1. SINKRONISASI LEVEL, EXP, COINS DARI FIRESTORE SECARA DINAMIS
async function loadStatsToAetherPlay(uid) {
    try {
        const activitySnap = await getDoc(doc(db, "daily_activities", uid));
        const data = activitySnap.exists() ? activitySnap.data() : {};

        const level = data.level || 1;
        const exp = data.exp || 0;
        const coins = data.coins || 0;
        const needed = expToNextLevel(level);

        // Update Text & Progress Bar di Panel Avatar Utama
        const levelText = document.getElementById("avatar-level-text");
        if (levelText) levelText.innerText = `Level ${String(level).padStart(2, '0')}`;

        const progressBar = document.getElementById("avatar-exp-progress");
        if (progressBar) {
            const percentage = Math.min((exp / needed) * 100, 100);
            progressBar.style.width = `${percentage}%`;
        }

        const coinAmountText = document.querySelector(".coin-amount");
        if (coinAmountText) coinAmountText.innerText = coins;

        // Sinkronisasi teks Header Pojok Kanan Atas
        const headerName = document.getElementById("header-username");
        const headerLvl = document.getElementById("header-level");
        
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists() && headerName) {
            headerName.innerText = userSnap.data().username || "User";
        }
        if (headerLvl) {
            headerLvl.innerText = `Level ${String(level).padStart(2, '0')}`;
        }

    } catch (err) {
        console.error("Gagal sinkronisasi data stat avatar:", err);
    }
}

// 2. AMBIL KATALOG ETALASE TOKO DARI ADMIN + DETEKSI LOCK LEVEL & KEPEMILIKAN
async function loadAvatarShopByCategory(categoryName, containerElementId, currentUserUID) {
    const container = document.getElementById(containerElementId);
    if (!container) return;
    container.innerHTML = "<p style='color:#888; text-align:center;'>Memuat koleksi item...</p>";

    try {
        const userDocRef = doc(db, "daily_activities", currentUserUID);
        const userSnap = await getDoc(userDocRef);
        
        const userCoins = userSnap.exists() ? (userSnap.data().coins || 0) : 0;
        const userLevel = userSnap.exists() ? (userSnap.data().level || 1) : 1; 

        // Tarik daftar ID baju yang telah dibeli user sebelumnya
        const ownedSnapshot = await getDocs(collection(db, "daily_activities", currentUserUID, "owned_items"));
        const ownedItemIds = [];
        ownedSnapshot.forEach(docSnap => ownedItemIds.push(docSnap.id));

        // Ambil data Master Katalog Avatar Shop dari Firestore Admin
        const shopSnapshot = await getDocs(collection(db, "avatar_shop"));
        container.innerHTML = ""; 

        let hasItems = false;

        shopSnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const itemId = item.item_id;

            if (item.category.toLowerCase() === categoryName.toLowerCase() && item.item_status === 1) {
                hasItems = true;
                const isOwned = ownedItemIds.includes(itemId);
                
                // Logika Lock Level otomatis mendeteksi field min_level dari Admin
                const minLevelRequired = item.min_level || 1;
                const isLevelLocked = userLevel < minLevelRequired;
                
                const itemBox = document.createElement("div");
                itemBox.className = `shop-item-card ${item.rarity || 'common'}`;
                itemBox.style.cssText = `
                    background: #fff; border: 2px solid #eef2f5; border-radius: 12px;
                    padding: 15px; text-align: center; display: flex; flex-direction: column;
                    align-items: center; justify-content: space-between; position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: 0.3s;
                `;

                let actionButtonHTML = "";
                if (isOwned) {
                    actionButtonHTML = `<button class="btn-use" data-img="${item.image_url}" data-cat="${categoryName}" style="background: #a3d944; color: #333; font-weight: 600; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; width: 100%;">Gunakan</button>`;
                } else if (isLevelLocked) {
                    actionButtonHTML = `
                        <button style="background: #cbd5e1; color: #64748b; border: none; padding: 8px 16px; border-radius: 8px; cursor: not-allowed; width: 100%; font-weight: 600; font-size:13px;" disabled>
                            🔒 Lvl ${minLevelRequired}
                        </button>
                    `;
                } else {
                    actionButtonHTML = `<button id="buy-btn-${itemId}" style="background: #ff9f43; color: white; font-weight: 600; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; width: 100%;">💰 ${item.price}</button>`;
                }

                itemBox.innerHTML = `
                    <div style="position:absolute; top:8px; right:8px; font-size:10px; text-transform:uppercase; font-weight:bold; color:#aaa;">${item.rarity || 'common'}</div>
                    <img src="${item.image_url}" style="width: 70px; height: 70px; object-fit: contain; margin-bottom: 10px;">
                    <h4 style="font-size: 14px; margin: 0 0 12px 0; font-weight:600; color:#333;">${item.item_name}</h4>
                    <div style="width:100%;">${actionButtonHTML}</div>
                `;

                container.appendChild(itemBox);

                // Pasang trigger fungsi beli koin jika level cukup dan belum punya
                if (!isOwned && !isLevelLocked) {
                    document.getElementById(`buy-btn-${itemId}`).onclick = async () => {
                        await executePurchaseItem(currentUserUID, userCoins, item, categoryName, containerElementId);
                    };
                }
            }
        });

        if (!hasItems) {
            container.innerHTML = "<p style='color:#aaa; grid-column: 1/-1; text-align:center;'>Belum ada item di kategori ini.</p>";
        }

        // PEMASANGAN DAN PENGGUNAAN BAJU/AKSESORIS PADA LAYER PREVIEW CHARACTER
        container.querySelectorAll(".btn-use").forEach(btn => {
            btn.onclick = (e) => {
                const imgUrl = e.target.getAttribute("data-img");
                const cat = e.target.getAttribute("data-cat").toLowerCase();
                
                if (cat === "eyes" && typeof window.changeEyes === "function") window.changeEyes(imgUrl);
                if (cat === "nose" && typeof window.changeNose === "function") window.changeNose(imgUrl);
                if (cat === "mouth" && typeof window.changeMouth === "function") window.changeMouth(imgUrl);
                if (cat === "hair" && typeof window.changeHair === "function") window.changeHair(imgUrl);
                
                if (cat === "left_blush") {
                    const b1 = document.getElementById("blush1");
                    if (b1) { b1.src = imgUrl; b1.style.display = "block"; }
                }
                if (cat === "right_blush") {
                    const b2 = document.getElementById("blush2");
                    if (b2) { b2.src = imgUrl; b2.style.display = "block"; }
                }
                
                // Semua sub-kategori tipe baju dilempar ke penanganan fungsi canvas changeBaju utama
                const bajuSubCategories = ["tshirt", "puffy_sleeve", "crop_top", "sleeveless", "sweater", "long_sleeve", "dress"];
                if (bajuSubCategories.includes(cat) && typeof window.changeBaju === "function") {
                    window.changeBaju(imgUrl);
                }
                
                showAetherToast("Item berhasil dipasang ke preview!", "success");
            };
        });

    } catch (err) {
        console.error("Gagal memuat sistem avatar shop:", err);
    }
}

// 3. LOGIKA UNLOCK/BELI ITEM MENGGUNAKAN MODAL KONFIRMASI KUSTOM
async function executePurchaseItem(uid, currentCoins, item, categoryName, containerId) {
    if (currentCoins < item.price) {
        showAetherToast("Koin kamu tidak mencukupi untuk membeli item ini!", "error");
        return;
    }

    // Ambil elemen-elemen modal kustom kita
    const modal = document.getElementById("aether-confirm-modal");
    const modalBox = document.getElementById("confirm-modal-box");
    const modalText = document.getElementById("confirm-modal-text");
    const acceptBtn = document.getElementById("confirm-accept-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");

    if (!modal || !modalText) return;

    // Setel text penawaran harga sesuai item yang di-klik
    modalText.innerHTML = `Beli <strong>${item.item_name}</strong> seharga <span style="color:#ff9f43; font-weight:bold;">💰 ${item.price}</span> koin?`;

    // Munculkan modal dengan animasi halus
    modal.style.display = "flex";
    setTimeout(() => {
        modal.style.opacity = "1";
        modalBox.style.transform = "scale(1)";
    }, 10);

    // Gunakan Promise untuk menunggu interaksi klik dari user (Beli atau Batal)
    const konfirmasiPilihan = await new Promise((resolve) => {
        acceptBtn.onclick = () => resolve(true);
        cancelBtn.onclick = () => resolve(false);
        // Jika user klik area gelap di luar box modal, otomatis membatalkan
        modal.onclick = (e) => { if (e.target === modal) resolve(false); };
    });

    // Sembunyikan kembali modalnya
    modal.style.opacity = "0";
    modalBox.style.transform = "scale(0.8)";
    setTimeout(() => { modal.style.display = "none"; }, 200);

    // Jika user menekan tombol 'Batal', hentikan fungsi di sini
    if (!konfirmasiPilihan) return;

    try {
        const sisaKoin = currentCoins - item.price;
        
        // Potong koin user di Firestore
        await updateDoc(doc(db, "daily_activities", uid), { coins: sisaKoin });
        
        // Masukkan item ke sub-collection owned_items user agar tersimpan selamanya
        await setDoc(doc(db, "daily_activities", uid, "owned_items", item.item_id), {
            bought_at: new Date(),
            item_name: item.item_name,
            image_url: item.image_url
        });

        // Tampilkan toast hijau estetik bawaan game kamu
        showAetherToast(`Berhasil membeli ${item.item_name}!`, "success");
        
        // Refresh data koin & susunan tombol etalase saat ini
        await loadStatsToAetherPlay(uid);
        await loadAvatarShopByCategory(categoryName, containerId, uid);

    } catch (error) {
        console.error("Proses transaksi pembelian item gagal:", error);
        showAetherToast("Terjadi kendala saat melakukan pembelian.", "error");
    }
}

// 4. INTERAKSI PERPINDAHAN MENU TAB UTAMA USER (DI-EXPORT KE WINDOW GLOBAL)
window.switchShopTab = async function(categoryName, containerId, buttonElement) {
    document.querySelectorAll(".shop-grid-panel").forEach(panel => {
        panel.style.display = "none";
    });
    
    const activeContainer = document.getElementById(containerId);
    if (activeContainer) {
        activeContainer.style.display = "grid";
    } else {
        console.error("Kontainer tidak ditemukan untuk ID:", containerId);
        return;
    }
    
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    if (buttonElement) buttonElement.classList.add("active");
    
    if (currentLoggedUID) {
        await loadAvatarShopByCategory(categoryName, containerId, currentLoggedUID);
    }
}

// 5. REGISTRASI KLIK DAN LOGIKA TOMBOL SIMPAN AVATAR MENGGUNAKAN HTML2CANVAS (KODE AMAN)
const saveBtn = document.getElementById("save-avatar-btn");
if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
        if (!currentLoggedUID) return;

        // Mengambil target container utama pembungkus avatar kamu (.avatar-box)
        const avatarContainer = document.querySelector(".avatar-box");

        if (!avatarContainer) {
            console.error("Kotak pembungkus avatar tidak ditemukan.");
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.innerText = "📸 Menjepret...";

            // Memotret secara utuh sesuai susunan asli CSS di layar tanpa potong-potong lebar/tinggi
            const canvas = await html2canvas(avatarContainer, {
                useCORS: true,
                backgroundColor: null, // Tetap transparan agar aman di dashboard
                logging: false,
                scale: 2             // Resolusi tajam (HD) agar tidak pecah saat dikecilkan di CSS
            });

            const avatarScreenshotImg = canvas.toDataURL("image/png");

            // Susunan data mentah
            const currentAvatarSetup = {
                eyes: document.getElementById("eyes")?.src || "",
                nose: document.getElementById("nose")?.src || "",
                mouth: document.getElementById("mouth")?.src || "",
                hair: document.getElementById("hair")?.src || "",
                baju: document.getElementById("baju")?.src || "",
                left_blush: document.getElementById("blush1")?.style.display !== "none" ? document.getElementById("blush1").src : "",
                right_blush: document.getElementById("blush2")?.style.display !== "none" ? document.getElementById("blush2").src : "",
                snapshot: avatarScreenshotImg, 
                updated_at: new Date()
            };

            // A. KONEKSI KE PROFILES
            await setDoc(doc(db, "profiles", currentLoggedUID), {
                avatar: avatarScreenshotImg
            }, { merge: true });

            // B. KONEKSI KE USERS_AVATAR
            await setDoc(doc(db, "users_avatar", currentLoggedUID), currentAvatarSetup, { merge: true });

            showAetherToast("Avatar berhasil disimpan dengan susunan rapi!", "success");

        } catch (err) {
            console.error("Gagal melakukan snapshot kustom:", err);
            showAetherToast("Gagal memproses screenshot avatar.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = "💾 Simpan Avatar";
        }
    });
}

// 6. DETEKSI STATUS OTENTIKASI LOGIN USER DI AWAL LOAD HALAMAN
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentLoggedUID = user.uid;
        
        // A. Sinkronisasikan Level & Koin asli dari Firestore
        await loadStatsToAetherPlay(currentLoggedUID);
        
        // B. JALANKAN INI: Muat setelan avatar terakhir yang pernah disimpan user agar tidak reset ke awal!
        await loadSavedAvatar(currentLoggedUID);
        
        // C. Pemicu awal agar data etalase jualan kategori pertama ('tshirt') langsung dimuat otomatis
        await loadAvatarShopByCategory("tshirt", "shop-tshirt", currentLoggedUID);
    } else {
        window.location.href = "login.html";
    }
});

// FUNGSI GLOBAL PEMBANTU CANVAS RENDER PREVIEW (Fungsi Bawaan dari Game Kamu)
window.changeBaju = function(src) { const el = document.getElementById("baju"); if (el) el.src = src; };
window.changeEyes = function(src) { const el = document.getElementById("eyes"); if (el) el.src = src; };
window.changeNose = function(src) { const el = document.getElementById("nose"); if (el) el.src = src; };
window.changeMouth = function(src) { const el = document.getElementById("mouth"); if (el) el.src = src; };
window.changeHair = function(src) { const el = document.getElementById("hair"); if (el) el.src = src; };

// Sistem toast notifikasi kustom pop-up pojok kanan bawah
function showAetherToast(message, type = "success") {
    let toast = document.getElementById("aether-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "aether-toast";
        toast.style.cssText = `
            position: fixed; bottom: 24px; right: 24px; max-width: 320px;
            padding: 14px 20px; border-radius: 12px; color: #fff;
            font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.25); z-index: 99999;
            opacity: 0; transform: translateY(16px); transition: 0.25s ease; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    toast.style.background = type === "error" ? "#ef4444" : "#10b981";
    toast.innerText = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(16px)";
    }, 3000);
}

// MEMBACA DAN MENERAPKAN AVATAR YANG SUDAH PERNAH DISIMPAN USER (SESUAI DATABASE DASHBOARD)
async function loadSavedAvatar(uid) {
    try {
        // Menggunakan "users_avatar" agar searah dengan dashboard
        const avatarSnap = await getDoc(doc(db, "users_avatar", uid));
        if (avatarSnap.exists()) {
            const data = avatarSnap.data();

            // Pasang kembali gambar-gambar sesuai konfigurasi yang tersimpan
            if (data.eyes)  { const el = document.getElementById("eyes");  if (el) el.src = data.eyes; }
            if (data.nose)  { const el = document.getElementById("nose");  if (el) el.src = data.nose; }
            if (data.mouth) { const el = document.getElementById("mouth"); if (el) el.src = data.mouth; }
            if (data.hair)  { const el = document.getElementById("hair");  if (el) el.src = data.hair; }
            if (data.baju)  { const el = document.getElementById("baju");  if (el) el.src = data.baju; }

            // Menangani Blush On Kiri
            const b1 = document.getElementById("blush1");
            if (b1) {
                if (data.left_blush) {
                    b1.src = data.left_blush;
                    b1.style.display = "block";
                } else {
                    b1.style.display = "none";
                }
            }

            // Menangani Blush On Kanan
            const b2 = document.getElementById("blush2");
            if (b2) {
                if (data.right_blush) {
                    b2.src = data.right_blush;
                    b2.style.display = "block";
                } else {
                    b2.style.display = "none";
                }
            }
            console.log("Konfigurasi pakaian berhasil ditarik dari kamar users_avatar!");
        }
    } catch (err) {
        console.error("Gagal memuat konfigurasi avatar tersimpan:", err);
    }
}
