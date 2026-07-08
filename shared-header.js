// shared-header.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("🔗 AETHERNA SHARED HEADER LOADED");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User terverifikasi di komponen global:", user.uid);
        
        // Alamat referensi dokumen data user
        const profileRef = doc(db, "profiles", user.uid);
        const activityRef = doc(db, "daily_activities", user.uid);

        try {
            // 1. Ambil data nama kustom dan foto dari koleksi 'profiles'
            const profileSnap = await getDoc(profileRef);
            let currentUsername = "User";
            
            if (profileSnap.exists()) {
                const profileData = profileSnap.data();
                currentUsername = profileData.name || "User";
                
                // Pasang foto profil ke elemen .user-avatar di header jika elemennya ada
                const avatarDiv = document.querySelector(".user-badge .user-avatar");
                if (avatarDiv && profileData.avatar) {
                    avatarDiv.style.backgroundImage = `url(${profileData.avatar})`;
                    avatarDiv.style.backgroundSize = "cover";
                    avatarDiv.style.backgroundPosition = "center";
                }
            }

            // Pasang nama ke komponen badge header kanan atas
            const nameBadge = document.querySelector(".user-badge .name");
            if (nameBadge) nameBadge.textContent = currentUsername;

            // 2. Ambil data Level dari koleksi 'daily_activities'
            const activitySnap = await getDoc(activityRef);
            if (activitySnap.exists()) {
                const activityData = activitySnap.data();
                const currentLevel = activityData.level || 1;

                // Pasang level ke komponen badge header kanan atas
                const levelBadge = document.querySelector(".user-badge .level");
                if (levelBadge) {
                    levelBadge.textContent = `Level ${String(currentLevel).padStart(2, '0')}`;
                }
            }

        } catch (error) {
            console.error("Gagal melakukan sinkronisasi komponen header global:", error);
        }
    } else {
        // Jika belum login, tendang balik ke halaman login secara otomatis
        window.location.href = "login.html";
    }
});