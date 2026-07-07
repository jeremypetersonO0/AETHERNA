import { db } from "../Firebase/Firebase-config.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

async function loadDashboard() {
    try {
        const users = await getDocs(collection(db, "users"));
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

if(articleList.length > 0){

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
if(videoList.length > 0){

    document.getElementById("videoActivityText").textContent =
        videoList[0].title;

}
let activeUsers = 0;

const today = new Date();

users.forEach((doc) => {

    const data = doc.data();

    if (data.last_login) {

        const loginDate = data.last_login.toDate();

        if (
            loginDate.getDate() === today.getDate() &&
            loginDate.getMonth() === today.getMonth() &&
            loginDate.getFullYear() === today.getFullYear()
        ) {
            activeUsers++;
        }

    }

});

document.getElementById("active-users").textContent = activeUsers;
        document.getElementById("total-users").textContent = users.size;
        document.getElementById("total-articles").textContent = contents.size;
        document.getElementById("active-tasks").textContent = tasks.size;
        document.getElementById("total-videos").textContent = videos.size;

        console.log("Dashboard loaded");
        console.log("Users:", users.size);
        console.log("Contents:", contents.size);
        console.log("Tasks:", tasks.size);

    } catch (err) {
        console.error(err);
    }
}

loadDashboard();