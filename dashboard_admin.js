import { db } from "../Firebase/Firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

async function loadDashboard() {
    try {
        const profiles = await getDocs(collection(db, "profiles"));
        const contents = await getDocs(collection(db, "contents"));
        const tasks = await getDocs(collection(db, "tasks"));
        const videos = await getDocs(collection(db, "videos"));

        // =========================
        // RECENT ARTICLE
        // =========================

        const articleList = [];

        contents.forEach(doc => {
            articleList.push(doc.data());
        });

        articleList.sort((a, b) => {

            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;

            return timeB - timeA;

        });

        if (articleList.length > 0) {

            document.getElementById("articleActivityText").textContent =
                articleList[0].title;

        }

        // =========================
        // RECENT VIDEO
        // =========================

        const videoList = [];

        videos.forEach(doc => {
            videoList.push(doc.data());
        });

        videoList.sort((a, b) => {

            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;

            return timeB - timeA;

        });
        if (videoList.length > 0) {

            document.getElementById("videoActivityText").textContent =
                videoList[0].title;

        }

        // =========================
        // ACTIVE USERS (profiles yang updatedAt-nya dalam X hari terakhir)
        // =========================

        const now = Date.now();
        const ACTIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari, sesuaikan jika perlu

        const activeUsersCount = profiles.docs.filter(doc => {
            const data = doc.data();
            if (!data.updatedAt) return false;

            // Jaga-jaga kalau updatedAt bukan Firestore Timestamp
            const updatedAtMs = typeof data.updatedAt.toMillis === "function"
                ? data.updatedAt.toMillis()
                : new Date(data.updatedAt).getTime();

            if (isNaN(updatedAtMs)) return false;

            return (now - updatedAtMs) <= ACTIVE_THRESHOLD_MS;
        }).length;

        // =========================
        // ACTIVE TASKS (status === true)
        // =========================

        const activeTasksCount = tasks.docs.filter(doc => {
            return doc.data().status === true;
        }).length;

        // =========================
        // RENDER STATS
        // =========================

        document.getElementById("total-users").textContent = profiles.size;
        document.getElementById("active-users").textContent = activeUsersCount;
        document.getElementById("total-articles").textContent = contents.size;
        document.getElementById("active-tasks").textContent = activeTasksCount;
        document.getElementById("total-videos").textContent = videos.size;

        console.log("Dashboard loaded");
        console.log("Total profiles (users):", profiles.size, "| Active users (7 hari):", activeUsersCount);
        console.log("Contents:", contents.size);
        console.log("Tasks:", tasks.size, "| Active tasks:", activeTasksCount);

    } catch (err) {
        console.error(err);
    }
}

loadDashboard();