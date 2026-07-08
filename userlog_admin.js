import { db } from "../firebase.js";
import {
    collectionGroup,
    getDocs,
    getDoc,
    doc,
    query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// PENTING soal import di atas:
// - Path "../firebase.js" mengasumsikan folder admin ini satu level di bawah
//   root project (sejajar sama file firebase.js kamu). Kalau struktur folder
//   kamu beda, sesuaikan path-nya. Yang penting file ini HARUS pakai
//   firebase.js yang sama dengan yang dipakai dashboard.js user, bukan file
//   config terpisah, biar keduanya baca dari project & instance yang sama.
// - Versi SDK Firestore juga disamakan ke 10.12.0 (sama kayak firebase.js),
//   soalnya mencampur beberapa versi SDK berbeda di project yang sama
//   (sebelumnya ada yang pakai v12.0.0) itu rawan bikin konflik atau bug aneh.

const tbody = document.querySelector("#userTable tbody");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

// Batas maksimal tiap habit, sama persis kayak yang dipakai di dashboard user
// (lihat data-max di dashborad.html) — dipakai buat ngitung status harian.
const HABIT_MAX = {
    sleep_duration: 8,
    exercise_duration: 30,
    water_intake: 8,
    break_count: 5
};

let allRows = []; // cache semua baris di memory biar search/filter ngga query ulang ke Firestore

// Status "Good/Moderate/Low" dihitung dari rata-rata persentase penyelesaian
// 4 habit hari itu. Ini pengganti field "daily_status" yang sebelumnya
// diasumsikan sudah ada di database, padahal belum pernah ditulis dari mana pun.
function computeStatus(day) {
    const ratios = Object.keys(HABIT_MAX).map(field => {
        const val = Number(day[field] || 0);
        const max = HABIT_MAX[field];
        return Math.min(val / max, 1);
    });
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;

    if (avg >= 0.75) return "Good";
    if (avg >= 0.4) return "Moderate";
    return "Low";
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    // dateStr formatnya "YYYY-MM-DD" (string biasa, bukan Firestore Timestamp)
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

async function loadUserLogs() {
    tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;

    // Sengaja TANPA orderBy("date", ...) di Firestore. Kalau ada dokumen lama
    // yang belum punya field "date" (misal peninggalan sebelum logging
    // diperbaiki), Firestore bakal exclude dokumen itu dari hasil orderBy —
    // padahal datanya sebenarnya ada. Jadi urutan tanggal kita atur manual
    // di JS aja setelah semua dokumen diambil, biar ngga ada yang kelewat
    // dan juga ngga perlu bikin index composite/exemption sama sekali.
    const historyQuery = query(collectionGroup(db, "history"));

    let snapshot;
    try {
        snapshot = await getDocs(historyQuery);
    } catch (err) {
        console.error("Gagal ambil data history:", err);
        tbody.innerHTML = `<tr><td colspan="8">Gagal memuat data. Cek console untuk detail error (kemungkinan security rules).</td></tr>`;
        return;
    }

    allRows = [];
    const profileCache = {}; // biar ngga getDoc "profiles" berkali-kali buat user yang sama

    for (const historyDoc of snapshot.docs) {
        const data = historyDoc.data();

        // Path dokumen ini: daily_activities/{uid}/history/{tanggal}
        // jadi uid = id dari dokumen induknya (parent.parent karena
        // parent pertama adalah collection "history" itu sendiri)
        const uid = historyDoc.ref.parent.parent.id;

        if (!profileCache[uid]) {
            try {
                const profileSnap = await getDoc(doc(db, "profiles", uid));
                profileCache[uid] = profileSnap.exists()
                    ? (profileSnap.data().name || "Unknown User")
                    : "Unknown User";
            } catch (err) {
                console.error(`Gagal ambil profil user ${uid}:`, err);
                profileCache[uid] = "Unknown User";
            }
        }

        const username = profileCache[uid];
        const status = computeStatus(data);
        const foodText = (data.meal_tags && data.meal_tags.length > 0)
            ? data.meal_tags.join(", ")
            : "-";

        allRows.push({
            uid,
            username,
            dateRaw: data.date,
            sleep: data.sleep_duration || 0,
            water: data.water_intake || 0,
            exercise: data.exercise_duration || 0,
            breaks: data.break_count || 0,
            food: foodText,
            status
        });
    }

    // Urutin manual di JS: tanggal terbaru di atas, dokumen yang belum
    // punya field "date" (data lama) ditaro paling bawah.
    allRows.sort((a, b) => {
        if (!a.dateRaw) return 1;
        if (!b.dateRaw) return -1;
        return b.dateRaw.localeCompare(a.dateRaw);
    });

    // DEBUG SEMENTARA: biar bisa diintip dari browser Console.
    // Boleh dihapus lagi nanti setelah selesai debugging.
    window.debugRows = allRows;

    renderRows(allRows);
}

function renderRows(rows) {
    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">No data found.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(row => `
        <tr>
            <td>${row.username}</td>
            <td>${formatDate(row.dateRaw)}</td>
            <td>${row.sleep} hours</td>
            <td>${row.water}/8</td>
            <td>${row.exercise} minute</td>
            <td>${row.breaks}</td>
            <td>${row.food}</td>
            <td class="${row.status.toLowerCase()}">${row.status}</td>
        </tr>
    `).join("");
}

function applyFilters() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;

    const filtered = allRows.filter(row => {
        const matchSearch = row.username.toLowerCase().includes(searchVal);
        const matchStatus = statusVal === "all" || row.status === statusVal;
        return matchSearch && matchStatus;
    });

    renderRows(filtered);
}

searchInput.addEventListener("input", applyFilters);
filterStatus.addEventListener("change", applyFilters);

loadUserLogs();