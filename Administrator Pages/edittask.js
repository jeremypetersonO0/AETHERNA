import { db } from "../Firebase/Firebase-config.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const taskId = params.get("id");

async function loadTask(){

    const taskRef = doc(db, "tasks", taskId);

    const taskSnap = await getDoc(taskRef);

    if(!taskSnap.exists()){
        alert("Task tidak ditemukan.");
        return;
    }

    const task = taskSnap.data();

    document.getElementById("taskName").value =
        task.task_name || "";

    document.getElementById("taskType").value =
        task.type || "";

    document.getElementById("taskXP").value =
        task.xp || 0;

    document.getElementById("taskCoins").value =
        task.coins || 0;
}

loadTask();

document
.getElementById("saveTaskBtn")
.addEventListener("click", async () => {

    await updateDoc(
        doc(db, "tasks", taskId),
        {
            task_name:
                document.getElementById("taskName").value,

            type:
                document.getElementById("taskType").value,

            xp:
                Number(
                    document.getElementById("taskXP").value
                ),

            coins:
                Number(
                    document.getElementById("taskCoins").value
                )
        }
    );

    alert("Task berhasil diperbarui.");

    window.location.href =
        "play_admin.html";
});