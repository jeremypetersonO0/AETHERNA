import { db } from "../firebase.js";
import {
    collectionGroup,
    getDocs,
    query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Sama seperti userlog_admin.js: pakai firebase.js yang sama dengan sisi user
// (bukan config terpisah), dan SDK versi 10.12.0 biar konsisten satu project.

const avgSleep = document.getElementById("avgSleep");
const avgExercise = document.getElementById("avgExercise");
const avgWater = document.getElementById("avgWater");
const avgBreaks = document.getElementById("avgBreaks");
const avgFood = document.getElementById("avgFood");

const metricFilter = document.getElementById("metricFilter");
const periodFilter = document.getElementById("periodFilter");
const chartTitle = document.getElementById("chartTitle");
const fallbackMessage = document.getElementById("fallbackMessage");

const ctx = document.getElementById("chart").getContext("2d");

let analyticsChart;
let allHistoryDocs = []; // cache semua dokumen history biar ngga query ulang tiap ganti filter

// Skor makanan (0-100) dihitung dari proporsi tag "sehat" dibanding total tag
// yang dipilih user hari itu. Ini pengganti field "food_score" yang
// sebelumnya diasumsikan ada di database, padahal belum pernah ditulis.
// Silakan sesuaikan daftar tag "sehat" ini kalau kriterianya mau diubah.
const HEALTHY_TAGS = ["Protein", "Fruits", "Vegetables", "Rice & Carbs"];

function computeFoodScore(mealTags) {
    if (!mealTags || mealTags.length === 0) return 0;
    const healthyCount = mealTags.filter(t => HEALTHY_TAGS.includes(t)).length;
    return Math.round((healthyCount / mealTags.length) * 100);
}

// Ambil SEMUA dokumen history dari SEMUA user sekaligus (lintas uid) pakai
// collectionGroup, karena path aslinya daily_activities/{uid}/history/{tanggal}.
// CATATAN: sama kayak userlog_admin.js, query ini kemungkinan minta kamu
// bikin composite index dulu — kalau error, ikuti link yang muncul di console.
async function loadAllHistory() {
    try {
        // Sengaja TANPA orderBy — biar dokumen lama yang belum punya field
        // "date" (peninggalan sebelum logging diperbaiki) tetap ikut kebaca,
        // dan ngga perlu bikin index composite/exemption di Firestore.
        const historyQuery = query(collectionGroup(db, "history"));
        const snapshot = await getDocs(historyQuery);

        allHistoryDocs = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            allHistoryDocs.push({
                date: data.date, // string "YYYY-MM-DD"
                sleep_duration: data.sleep_duration || 0,
                exercise_duration: data.exercise_duration || 0,
                water_intake: data.water_intake || 0,
                break_count: data.break_count || 0,
                food_score: computeFoodScore(data.meal_tags)
            });
        });
    } catch (err) {
        console.error("Gagal ambil data history:", err);
        fallbackMessage.textContent = "Gagal memuat data. Cek console untuk detail error.";
    }
}

// ==========================
// SUMMARY CARDS
// ==========================

function loadSummaryCards() {
    if (allHistoryDocs.length === 0) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recentData = allHistoryDocs.filter(d => d.date >= sevenDaysAgoStr);
    const dataset = recentData.length > 0 ? recentData : allHistoryDocs;

    let sleep = 0, exercise = 0, water = 0, breaks = 0, food = 0;

    dataset.forEach(d => {
        sleep += d.sleep_duration;
        exercise += d.exercise_duration;
        water += d.water_intake;
        breaks += d.break_count;
        food += d.food_score;
    });

    const count = dataset.length;

    avgSleep.textContent = `${(sleep / count).toFixed(1)} hours`;
    avgExercise.textContent = `${Math.round(exercise / count)} mins`;
    avgWater.textContent = `${(water / count).toFixed(1)}/8`;
    avgBreaks.textContent = `${Math.round(breaks / count)} times`;
    avgFood.textContent = `${(food / count).toFixed(1)}%`;
}

// ==========================
// CHART
// ==========================

function createChart(labels, values) {
    const gradient = ctx.createLinearGradient(0, 0, 900, 0);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(0.5, "#22c55e");
    gradient.addColorStop(1, "#84cc16");

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                borderColor: gradient,
                borderWidth: 4,
                tension: 0.5,
                pointRadius: 4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
                    ticks: { color: "#999" }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)", borderDash: [6, 6] },
                    ticks: { color: "#999" }
                }
            }
        }
    });
}

// ==========================
// LOAD CHART DATA
// ==========================

function loadChart() {
    const metric = metricFilter.value;
    const days = parseInt(periodFilter.value);

    const labels = [];
    const values = [];
    const counts = new Array(days).fill(0);
    const sums = new Array(days).fill(0);
    const dateStrings = [];

    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        dateStrings.push(dateStr);
        labels.push(
            date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
        );
        values.push(0);
    }

    allHistoryDocs.forEach(d => {
        const idx = dateStrings.indexOf(d.date);
        if (idx === -1) return;
        sums[idx] += Number(d[metric] || 0);
        counts[idx]++;
    });

    for (let i = 0; i < days; i++) {
        values[i] = counts[i] > 0 ? sums[i] / counts[i] : 0;
    }

    const totalEntries = counts.reduce((a, b) => a + b, 0);

    if (totalEntries === 0 && allHistoryDocs.length > 0) {
        // Dari semua dokumen yang ada, cuma yang punya field "date" yang
        // bisa ditampilkan di chart (perlu tanggal buat sumbu-x). Dokumen
        // lama tanpa "date" di-skip di sini, bukan di-hilangkan dari data.
        const docsWithDate = allHistoryDocs.filter(d => d.date);

        if (docsWithDate.length === 0) {
            fallbackMessage.textContent =
                "No dated records yet. Data will appear here once habits are logged with the updated app.";
            chartTitle.textContent = titles[metric];
            createChart([], []);
            return;
        }

        fallbackMessage.textContent =
            "No data found in selected period. Showing all available records.";

        labels.length = 0;
        values.length = 0;

        docsWithDate.forEach(d => {
            labels.push(
                new Date(d.date + "T00:00:00").toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })
            );
            values.push(Number(d[metric] || 0));
        });
    } else if (totalEntries > 0) {
        fallbackMessage.textContent = "";
    }

    const titles = {
        sleep_duration: "Sleep Trend",
        exercise_duration: "Exercise Trend",
        water_intake: "Water Intake Trend",
        break_count: "Break Trend",
        food_score: "Food Score Trend"
    };

    chartTitle.textContent = titles[metric];
    createChart(labels, values);
}

// ==========================
// EVENT LISTENER
// ==========================

metricFilter.addEventListener("change", loadChart);
periodFilter.addEventListener("change", loadChart);

// ==========================
// INITIAL LOAD
// ==========================

(async function init() {
    await loadAllHistory();
    loadSummaryCards();
    loadChart();
})();