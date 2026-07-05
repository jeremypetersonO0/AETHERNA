import { db } from "../Firebase/Firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const contentId = params.get("id");
const collectionName = params.get("collection");

const titleInput = document.getElementById("title");
const subtitleInput = document.getElementById("subtitle");
const authorInput = document.getElementById("author");
const tagsInput = document.getElementById("tags");

const articleSection = document.getElementById("articleSection");
const videoSection = document.getElementById("videoSection");

const articleContent = document.getElementById("articleContent");

const articleImagePreview =
    document.getElementById("articleImagePreview");

const thumbnailPreview =
    document.getElementById("thumbnailPreview");

const currentVideoName =
    document.getElementById("currentVideoName");

const contentType =
    document.getElementById("contentType");

const lastUpdated =
    document.getElementById("lastUpdated");

const saveBtn =
    document.getElementById("saveBtn");


async function loadContent(){

    const docRef = doc(
        db,
        collectionName,
        contentId
    );

    const snap = await getDoc(docRef);

    if(!snap.exists()){
        alert("Content tidak ditemukan.");
        return;
    }

    const data = snap.data();

    titleInput.value = data.title || "";
    subtitleInput.value = data.subtitle || "";
    tagsInput.value = data.content_tags || "";

    // ======================
    // ARTICLE
    // ======================

    if(collectionName === "contents"){

        contentType.value = "Article";

        authorInput.value = data.author || "";

        articleSection.style.display = "block";
        videoSection.style.display = "none";

        articleContent.value =
            data.content || "";

        articleImagePreview.src =
            data.image_url || "";

        if(data.created_at){

            lastUpdated.textContent =
                data.created_at
                    .toDate()
                    .toLocaleDateString("id-ID");

        }

    }

    // ======================
    // VIDEO
    // ======================

    if(collectionName === "videos"){

        contentType.value = "Video";

        authorInput.value =
            data.creator || "";

        articleSection.style.display = "none";
        videoSection.style.display = "block";

        thumbnailPreview.src =
            data.thumbnail_url || "";

        currentVideoName.textContent =
            data.video_url
                ? data.video_url.split("/").pop()
                : "No video uploaded";

        if(data.createdAt){

            lastUpdated.textContent =
                data.createdAt
                    .toDate()
                    .toLocaleDateString("id-ID");

        }

    }
}

loadContent();



saveBtn.addEventListener(
    "click",
    async () => {

        try {

            let updateData = {
                title: titleInput.value,
                subtitle: subtitleInput.value,
                content_tags: tagsInput.value,
                updated_at: serverTimestamp()
            };

            if(collectionName === "contents"){

                updateData.author =
                    authorInput.value;

                updateData.content =
                    articleContent.value;

            }

            if(collectionName === "videos"){

                updateData.creator =
                    authorInput.value;

            }

            await updateDoc(
                doc(
                    db,
                    collectionName,
                    contentId
                ),
                updateData
            );

            alert(
                "Content berhasil diperbarui."
            );

            window.location.href =
                "content_admin.html";

        } catch(error){

            console.error(error);

            alert(
                "Gagal memperbarui konten."
            );

        }

    }
);