import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const itemsTableBody = document.getElementById("itemsTableBody");

async function loadItems() {

    itemsTableBody.innerHTML = "";

    const snapshot = await getDocs(collection(db, "avatar_shop"));

    snapshot.forEach((documentSnapshot) => {

        const item = documentSnapshot.data();
        const docId = documentSnapshot.id;

        const row = `
            <tr>
                <td>${item.item_name}</td>
                <td>${item.category}</td>
                <td>${item.min_level}</td>
                <td>${item.price}</td>
                <td>${item.item_status === 1 ? "Available" : "Hidden"}</td>

                <td>
                    <button
                        class="btn-edit"
                        onclick="editItem('${docId}')"
                    >
                        Edit
                    </button>

                    <button
                        class="btn-delete"
                        onclick="deleteItem('${docId}')"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;

        itemsTableBody.innerHTML += row;
    });
}

window.deleteItem = async function(docId){

    const confirmDelete =
        confirm("Delete this item?");

    if(!confirmDelete) return;

    await deleteDoc(
        doc(db, "avatar_shop", docId)
    );

    loadItems();
}

window.editItem = function(docId){
    window.location.href =
        `edititem.html?id=${docId}`;
}

const tasksTableBody = document.getElementById("tasksTableBody");

async function loadTasks() {

    tasksTableBody.innerHTML = "";

    const snapshot = await getDocs(
        collection(db, "tasks")
    );

    snapshot.forEach((documentSnapshot) => {

        const task = documentSnapshot.data();
        const docId = documentSnapshot.id;

        const row = `
            <tr>
                <td>${task.task_name}</td>
                <td>${task.type}</td>
                <td>${task.xp} XP</td>
                <td>${task.coins}</td>
                <td>${task.status ? "Active" : "Inactive"}</td>

                <td>
                    <button
                        class="btn-edit"
                        onclick="editTask('${docId}')"
                    >
                        Edit
                    </button>

                    <button
                        class="btn-delete"
                        onclick="deleteTask('${docId}')"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;

        tasksTableBody.innerHTML += row;
    });
}

window.deleteTask = async function(docId){

    const confirmDelete =
        confirm("Delete this task?");

    if(!confirmDelete) return;

    await deleteDoc(
        doc(db, "tasks", docId)
    );

    loadItems();
}

window.editTask = function(docId){

    window.location.href =
        `edittask.html?id=${docId}`;

}


loadItems();
loadTasks();