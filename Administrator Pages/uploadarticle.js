import { db } from "../Firebase/Firebase-config.js";
import { supabase } from "../Supabase/supabase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const form = document.getElementById("articleForm");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        // ==========================
        // Ambil data form
        // ==========================

        const title = document.getElementById("title").value.trim();
        const subtitle = document.getElementById("subtitle").value.trim();
        const author = document.getElementById("author").value.trim();
        const tags = document.getElementById("tags").value.trim();
        const content = document.getElementById("content").value.trim();

        const imageFile =
            document.getElementById("coverImage").files[0];

        if (!title || !author || !content) {
            alert("Mohon isi semua data wajib.");
            return;
        }

        let imageUrl = "";

        // ==========================
        // Upload gambar ke Supabase
        // ==========================

        if (imageFile) {

            const fileName =
                `${Date.now()}-${imageFile.name}`;

            const { error } =
                await supabase.storage
                    .from("articles")
                    .upload(fileName, imageFile);

            if (error) throw error;

            const { data } =
                supabase.storage
                    .from("articles")
                    .getPublicUrl(fileName);

            imageUrl = data.publicUrl;
        }

        // ==========================
        // Simpan ke Firestore
        // ==========================

await addDoc(collection(db, "contents"), {

    admin_id: "UID_ADMIN",
    author: author,
    body_content: content,
    content_tags: tags,
    content_type: 0,
    duration: 0,
    createdAt: serverTimestamp(),
    last_updated: serverTimestamp(),
    status: 0,
    thumbnail_url: imageUrl,
    title: title,
    subtitle: subtitle,
    video_url: "",
    views: 0

});

        alert("Article berhasil dipublish!");

        form.reset();

        window.location.href = "content_admin.html";

    }

    catch (err) {

        console.error(err);

        alert(err.message);

    }

});