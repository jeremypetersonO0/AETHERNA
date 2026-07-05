import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const form = document.getElementById("videoForm");
console.log(form);
function getYoutubeID(url) {

    const regExp =
        /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?v=))([^#&?]*).*/;

    const match = url.match(regExp);

    return (match && match[7].length === 11)
        ? match[7]
        : null;

}

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    try {

        const title = document.getElementById("title").value;
        const subtitle = document.getElementById("subtitle").value;
        const creator = document.getElementById("creator").value;
        const tags = document.getElementById("tags").value;
        const youtubeUrl = document.getElementById("youtubeUrl").value;

        const videoId = getYoutubeID(youtubeUrl);

        if (!videoId) {
            alert("Link YouTube tidak valid!");
            return;
        }

        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        const thumbnailUrl =
            `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // ==========================
        // Simpan ke Firestore
        // ==========================
        console.log("Title:", title);
        console.log("Youtube:", youtubeUrl);
        console.log("Embed:", embedUrl);
        console.log("Thumbnail:", thumbnailUrl);
        const docRef = await addDoc(collection(db, "videos"), {

            title,
            subtitle,
            creator,
            tags,
            youtubeUrl,
            embedUrl,
            thumbnailUrl,

            status: "Published",

            createdAt: serverTimestamp()

        });
        console.log("Berhasil disimpan:", docRef.id);
        alert("Video berhasil dipublish!");

    } catch (error) {

        console.error(error);
        alert(error.message);

    }

});