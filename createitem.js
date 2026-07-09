import { db } from "../Firebase/Firebase-config.js";
import { supabase } from "../Supabase/Supabase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const createBtn = document.querySelector(".btn-create");

if (createBtn) {
    createBtn.addEventListener("click", async () => {
        const itemName = document.getElementById("itemName").value.trim();
        const level = Number(document.getElementById("level").value) || 1;
        const price = Number(document.getElementById("price").value) || 0;
        const rarity = document.getElementById("rarity").value.trim() || "common";

        const fileInput = document.getElementById("itemImage");
        const file = fileInput ? fileInput.files[0] : null;
        const category = document.getElementById("category").value;

        // Validasi wajib isi
        if (!itemName || !category || !file) {
            alert("Lengkapi semua data beserta file gambar item!");
            return;
        }

        try {
            // Nonaktifkan tombol saat loading agar tidak ter-submit double
            createBtn.disabled = true;
            createBtn.innerText = "Processing...";

            // Membuat ID Item unik
            const itemId = `${category.toLowerCase()}_${Date.now()}`;
            const fileName = `${itemId}_${file.name}`;

            // 1. Upload file gambar ke Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatar-items")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Ambil Public URL gambar dari Supabase
            const { data } = supabase.storage
                .from("avatar-items")
                .getPublicUrl(fileName);

            const imageUrl = data.publicUrl;

            // 3. Simpan data lengkap katalog item ke Firestore database admin
            await addDoc(collection(db, "avatar_shop"), {
                item_id: itemId,
                item_name: itemName,
                category: category.toLowerCase(), // simpan huruf kecil agar sinkron dengan tab
                image_url: imageUrl,
                min_level: level,
                price: price,
                rarity: rarity.toLowerCase(),
                item_status: 1, // 1 berarti langsung aktif/available di toko player
                created_at: serverTimestamp()
            });

            alert("Item baru berhasil dibuat & dimasukkan ke etalase!");
            window.location.href = "play_admin.html";

        } catch (err) {
            console.error("Gagal membuat item baru:", err);
            alert("Error: " + err.message);
        } finally {
            // Kembalikan status tombol jika terjadi gagal/berhasil
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.innerText = "Create Item";
            }
        }
    });
}