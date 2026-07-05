import { db } from "../Firebase/Firebase-config.js";
import { supabase } from "../Supabase/supabase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const createBtn = document.querySelector(".btn-create");

createBtn.addEventListener("click", async () => {

    const itemName = document.getElementById("itemName").value;
    const category = document.getElementById("category").value;
    const level = Number(document.getElementById("level").value);
    const price = Number(document.getElementById("price").value);
    const rarity = document.getElementById("rarity").value || "common";

    const file = document.getElementById("itemImage").files[0];

    if (!itemName || !category || !file) {
        alert("Lengkapi semua data.");
        return;
    }

    try {

        const itemId =
            `${category.toLowerCase()}_${Date.now()}`;

        const fileName =
            `${itemId}_${file.name}`;

        const { error: uploadError } =
            await supabase.storage
                .from("avatar-items")
                .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } =
            supabase.storage
                .from("avatar-items")
                .getPublicUrl(fileName);

        const imageUrl = data.publicUrl;

        await addDoc(
            collection(db, "avatar_shop"),
            {
                item_id: itemId,
                item_name: itemName,
                category: category,
                image_url: imageUrl,
                min_level: level,
                price: price,
                rarity: rarity,
                item_status: 1,
                created_at: serverTimestamp()
            }
        );

        alert("Item berhasil dibuat.");

        window.location.href = "play_admin.html";

    } catch (err) {
        console.error(err);
        alert(err.message);
    }

});