import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const createBtn = document.querySelector(".btn-create");

createBtn.addEventListener("click", async () => {

    const taskName = document.getElementById("taskName").value.trim();
    const taskType = document.getElementById("taskType").value.trim();
    const taskXP = Number(document.getElementById("taskXP").value);
    const taskCoins = Number(document.getElementById("taskCoins").value);

    if (!taskName || !taskType) {
        alert("Lengkapi semua data.");
        return;
    }

    try {

        await addDoc(
            collection(db, "tasks"),
            {
                task_name: taskName,
                type: taskType,
                xp: taskXP,
                coins: taskCoins,
                status: true,
                created_at: serverTimestamp()
            }
        );

        alert("Task berhasil dibuat.");

        window.location.href = "play_admin.html";

    } catch (error) {

        console.error(error);
        alert("Gagal membuat task.");
    }
});