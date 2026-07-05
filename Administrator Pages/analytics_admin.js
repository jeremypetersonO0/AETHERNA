import { db } from "../Firebase/Firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const avgSleep = document.getElementById("avgSleep");
const avgExercise = document.getElementById("avgExercise");
const avgWater = document.getElementById("avgWater");
const avgBreaks = document.getElementById("avgBreaks");
const avgFood = document.getElementById("avgFood");

const metricFilter = document.getElementById("metricFilter");
const periodFilter = document.getElementById("periodFilter");
const chartTitle = document.getElementById("chartTitle");
const fallbackMessage =
    document.getElementById("fallbackMessage");

const ctx = document.getElementById("chart").getContext("2d");

let analyticsChart;


// ==========================
// SUMMARY CARDS
// ==========================

async function loadSummaryCards() {

    const snapshot = await getDocs(
        collection(db, "daily_activities")
    );

    let sleep = 0;
    let exercise = 0;
    let water = 0;
    let breaks = 0;
    let food = 0;

    let count = 0;

    const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentData = [];
const allData = [];

snapshot.forEach(doc => {

    const data = doc.data();

    if (!data.log_date) return;

    const logDate = data.log_date.toDate();

    allData.push(data);

    if (logDate >= sevenDaysAgo) {
        recentData.push(data);
    }
});

const dataset =
    recentData.length > 0
        ? recentData
        : allData;

dataset.forEach(data => {

    sleep += Number(data.sleep_duration || 0);
    exercise += Number(data.exercise_duration || 0);
    water += Number(data.water_intake || 0);
    breaks += Number(data.break_count || 0);
    food += Number(data.food_score || 0);

    count++;
});

    if (count === 0) return;

    avgSleep.textContent =
        `${(sleep / count).toFixed(1)} hours`;

    avgExercise.textContent =
        `${Math.round(exercise / count)} mins`;

    avgWater.textContent =
        `${(water / count).toFixed(1)}/8`;

    avgBreaks.textContent =
        `${Math.round(breaks / count)} times`;

    avgFood.textContent =
        `${(food / count).toFixed(1)}%`;
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
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(0,0,0,0.05)",
                        drawBorder: false
                    },
                    ticks: {
                        color: "#999"
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(0,0,0,0.05)",
                        borderDash: [6,6]
                    },
                    ticks: {
                        color: "#999"
                    }
                }
            }
        }
    });
}


// ==========================
// LOAD CHART DATA
// ==========================

async function loadChart() {

    const metric = metricFilter.value;
    const days = parseInt(periodFilter.value);

    const snapshot = await getDocs(
        collection(db, "daily_activities")
    );

    const labels = [];
    const values = [];

    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {

        const date = new Date();
        date.setDate(now.getDate() - i);

        labels.push(
            date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short"
            })
        );

        values.push(0);
    }

    const counts = new Array(days).fill(0);

    snapshot.forEach(doc => {

        const data = doc.data();

        if (!data.log_date) return;

        const logDate = data.log_date.toDate();

        const diff =
            Math.floor(
                (now - logDate) /
                (1000 * 60 * 60 * 24)
            );

        if (diff >= 0 && diff < days) {

            const index = days - diff - 1;

            values[index] += Number(data[metric] || 0);

            counts[index]++;
        }
    });
    const totalEntries = counts.reduce((a,b) => a + b, 0);

if (totalEntries === 0) {
    fallbackMessage.textContent =
    "No data found in selected period. Showing all available records.";

    labels.length = 0;
    values.length = 0;

    snapshot.forEach(doc => {

        const data = doc.data();

        if (!data.log_date) return;

        labels.push(
            data.log_date.toDate().toLocaleDateString(
                "id-ID",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            )
        );

        values.push(
            Number(data[metric] || 0)
        );
    });
}

    for (let i = 0; i < values.length; i++) {
        if (counts[i] > 0) {
            values[i] /= counts[i];
        }
    }

    const titles = {
        sleep_duration: "Sleep Trend",
        exercise_duration: "Exercise Trend",
        water_intake: "Water Intake Trend",
        break_count: "Break Trend",
        food_score: "Food Score Trend"
    };

    chartTitle.textContent = titles[metric];
    if (totalEntries > 0) {
    fallbackMessage.textContent = "";}
    createChart(labels, values);
}


// ==========================
// EVENT LISTENER
// ==========================

metricFilter.addEventListener(
    "change",
    loadChart
);

periodFilter.addEventListener(
    "change",
    loadChart
);


// ==========================
// INITIAL LOAD
// ==========================

loadSummaryCards();
loadChart();