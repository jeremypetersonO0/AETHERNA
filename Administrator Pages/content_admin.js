import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const table = document.getElementById("contentTable");
const modal = document.getElementById("deleteModal");
const confirmBtn = document.getElementById("confirmDelete");
const cancelBtn = document.getElementById("cancelDelete");
const deleteTitle = document.getElementById("deleteTitle");
const contentName = document.getElementById("contentName");

let selectedId = null;
let selectedCollection = null;

async function loadContents() {

    table.innerHTML = "";

    // =========================
    // ARTICLE
    // =========================

    const articleSnapshot = await getDocs(collection(db, "contents"));

    articleSnapshot.forEach(doc => {

        const data = doc.data();

        const date = data.created_at
            ? data.created_at.toDate().toLocaleDateString("id-ID")
            : "-";

        table.innerHTML += `
            <tr>
                <td>${data.title}</td>
                <td>Article</td>
                <td>${data.author}</td>
                <td>${data.content_tags}</td>
                <td class="status published">${data.status}</td>
                <td>-</td>
                <td>${date}</td>
                <td class="actions">
                    <button
    class="btn-edit"
    onclick="editContent('${doc.id}','contents','${data.title}')">
    Edit
</button>
                    <button
                        class="btn-delete"
                        onclick="deleteContent('${doc.id}','contents','${data.title}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    // =========================
    // VIDEO
    // =========================

    const videoSnapshot = await getDocs(collection(db, "videos"));

    videoSnapshot.forEach(doc => {

        const data = doc.data();

        const date = data.createdAt
            ? data.createdAt.toDate().toLocaleDateString("id-ID")
            : "-";

        table.innerHTML += `
            <tr>
                <td>${data.title}</td>
                <td>Video</td>
                <td>${data.creator}</td>
                <td>${data.content_tags}</td>
                <td class="status published">${data.status}</td>
                <td>-</td>
                <td>${date}</td>
                <td class="actions">
                    <button
    class="btn-edit"
    onclick="editContent('${doc.id}','videos','${data.title}')">
    Edit
</button>
                    <button
                        class="btn-delete"
                        onclick="deleteContent('${doc.id}','videos','${data.title}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

}

loadContents();

window.editContent = function(id, collectionName){

    window.location.href =
        `editcontent.html?id=${id}&collection=${collectionName}`;

}

window.deleteContent = function(id, collectionName, title){

    selectedId = id;
    selectedCollection = collectionName;

    contentName.textContent = title;

    if(collectionName === "contents"){

        deleteTitle.textContent = "Delete Article?";

    }else{

        deleteTitle.textContent = "Delete Video?";

    }

    modal.classList.add("show");

}

cancelBtn.onclick = () => {

    modal.classList.remove("show");

}

confirmBtn.onclick = async () => {

    try {

        await deleteDoc(
            doc(db, selectedCollection, selectedId)
        );

        modal.classList.remove("show");

        loadContents();

    } catch (error) {

        console.error(error);

        alert("Gagal menghapus konten.");

    }

};