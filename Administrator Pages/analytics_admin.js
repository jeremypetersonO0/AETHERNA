const ctx = document.getElementById('chart').getContext('2d');

/* GRADIENT LINE */
const gradient = ctx.createLinearGradient(0, 0, 900, 0);
gradient.addColorStop(0, "#3b82f6");
gradient.addColorStop(0.5, "#22c55e");
gradient.addColorStop(1, "#84cc16");

new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['-20','-15','-10','-5','0','5','10','15','20'],
        datasets: [{
            data: [35,10,-10,20,-15,0,40,15,-5],
            borderColor: gradient,
            borderWidth: 4,
            tension: 0.5,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display:false } },
        scales: {
            x: {
                grid: {
                    color: "rgba(0,0,0,0.05)",
                    drawBorder:false
                },
                ticks: { color:"#999" }
            },
            y: {
                min: -30,
                max: 50,
                grid: {
                    color:"rgba(0,0,0,0.05)",
                    borderDash:[6,6]
                },
                ticks: { color:"#999" }
            }
        }
    }
});