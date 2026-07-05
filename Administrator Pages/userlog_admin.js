import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const q = query(
    collection(db, "daily_activities"),
    orderBy("log_date", "desc")
);

const snapshot = await getDocs(q);

const tbody = document.querySelector("#userTable tbody");
async function loadUserLogs(){
    const snapshot =
    await getDocs(collection(db,"daily_activities"));

    tbody.innerHTML="";

    for(const activity of snapshot.docs){
    const data = activity.data();
    console.log("Activity:", data);
    console.log("UID:", data.userID);

const userSnap = await getDoc(
    doc(db,"users",data.userID)
);
console.log("exists:", userSnap.exists());

if(userSnap.exists()){
    console.log(userSnap.data());
}

console.log(userSnap.exists());
if (!userSnap.exists()) {
    console.log("User tidak ditemukan:", data.userID);
    continue;
}
    const user = userSnap.data();
    const username = user.username;
    tbody.innerHTML += `
<tr>

    <td>${username}</td>
    <td>${
        data.log_date.toDate().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    }</td>

    <td>${data.sleep_duration} hours</td>

    <td>${data.water_intake}/8</td>

    <td>${data.exercise_duration} minute</td>

    <td>${data.break_count}</td>

    <td>${data.food_quality}</td>
    <td class="${getStatus(data.daily_status).toLowerCase()}">
        ${getStatus(data.daily_status)}
    </td>
</tr>
`;

}
function getStatus(status){

    switch(status){

        case 0:
            return "Low";

        case 1:
            return "Moderate";

        case 2:
            return "Good";

        default:
            return "-";

    }

}
}

loadUserLogs();