// 1. Prototype Helper (Your Legacy Code)
Number.prototype.formatMoney = function (c, d, t) {
    var nu = this,
        mdp = nu / 1000000 > 1 ? " mdp" : "",
        n = nu / 1000000 > 1 ? nu / 1000000 : nu,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "") + mdp;
};

// 2. Data Logic
async function initFiraViz() {
    const statusEl = document.getElementById('api-status');
    const API_BASE = 'https://cors-fira.onrender.com/?url=https://www.fira.gob.mx/Datos/SPFC/';
    const monthLabels = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    try {
        statusEl.innerText = "Processing Data...";

        // Fetch both files
        const [saldoRes, flujoRes] = await Promise.all([
            fetch(`${API_BASE}Saldo.csv`).catch(() => null),
            fetch(`${API_BASE}Flujo.csv`).catch(() => null)
        ]);

        let saldoMap = {};
        let flujoMap = {};

        // 1. AGGREGATE SALDO (Sum all rows per Year-Month)
        if (saldoRes && saldoRes.ok) {
            saldoMap = aggregateByTime(await saldoRes.text());
        } else throw new Error("Saldo Unreachable");

        // 2. AGGREGATE FLUJO
        if (flujoRes && flujoRes.ok) {
            flujoMap = aggregateByTime(await flujoRes.text());
        }

        // 3. DETERMINE TARGET MONTH (Latest available in Saldo)
        // Get all "Year-Month" keys
        const keys = Object.keys(saldoMap);
        if (keys.length === 0) throw new Error("Empty Data");

        // Sort keys to find the absolute last date (e.g., "2024-11")
        keys.sort((a, b) => {
            const [yA, mA] = a.split('-').map(Number);
            const [yB, mB] = b.split('-').map(Number);
            return (yA - yB) || (mA - mB);
        });

        const latestKey = keys[keys.length - 1];
        const [latestYear, latestMonth] = latestKey.split('-').map(Number);

        // 4. BUILD 5-YEAR HISTORY
        // We want [2020-11, 2021-11, ... 2024-11]
        const historyData = [];
        for (let i = 4; i >= 0; i--) {
            const targetYear = latestYear - i;
            const lookupKey = `${targetYear}-${latestMonth}`;

            historyData.push({
                year: targetYear,
                month: latestMonth,
                saldo: saldoMap[lookupKey] || 0,
                flujo: flujoMap[lookupKey] || 0
            });
        }

        statusEl.innerText = `Cifras al mes de ${monthLabels[latestMonth - 1]}`;
        statusEl.style.color = "#1ba77b";

        renderComboChart(historyData, monthLabels[latestMonth - 1]);

    } catch (err) {
        console.warn("FIRA Visualization Error:", err);
        statusEl.innerText = "Simulacion (Datos no disponibles)";

        // Generate Correct Simulation (Different Years)
        const currYear = new Date().getFullYear();
        const mockData = Array.from({ length: 5 }, (_, i) => ({
            year: currYear - 4 + i,
            month: 11,
            // Random growing numbers
            saldo: 150000000 + (i * 20000000) + (Math.random() * 5000000),
            flujo: 120000000 + (i * 15000000) + (Math.random() * 5000000)
        }));
        renderComboChart(mockData, "Noviembre");
    }
}

// Helper: Aggregates CSV data by "Year-Month"
function aggregateByTime(csvText) {
    const rows = csvText.split(/[\r\n]+/g);
    const agg = {}; // Key: "2023-11", Value: 12345.00

    // Start at 1 to skip header
    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols.length > 10) {
            const year = cols[0];
            const month = cols[1];
            // Your legacy code sums column 10
            const val = parseFloat(cols[10]);

            if (year && month && !isNaN(val)) {
                const key = `${year}-${month}`;
                if (!agg[key]) agg[key] = 0;
                agg[key] += val;
            }
        }
    }
    return agg;
}

// 3. SVG Combo Chart Logic
function renderComboChart(data, monthName) {
    const svg = document.getElementById('fira-cifras-svg');
    const tooltip = document.getElementById('viz-tooltip');

    // Clear and set baseline
    svg.innerHTML = '<line x1="0" y1="140" x2="300" y2="140" stroke="#444" stroke-width="1"></line>';

    const width = 300;
    const height = 150;
    const margin = 20;
    const barWidth = (width - (margin * 2)) / data.length - 20; // Space out bars

    // Scale Max Value
    const maxVal = Math.max(
        ...data.map(d => d.saldo),
        ...data.map(d => d.flujo)
    ) * 1.1;

    // --- 1. DRAW BARS (Saldo) ---
    data.forEach((d, i) => {
        const barHeight = (d.saldo / maxVal) * (height - 30);
        // Calculate X position center of slot
        const slotWidth = (width - margin * 2) / data.length;
        const x = margin + (i * slotWidth) + (slotWidth - barWidth) / 2;
        const y = (height - 10) - barHeight;

        // The Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", 150);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", 0);
        rect.setAttribute("fill", "#1ba77b"); // Saldo Teal
        rect.setAttribute("class", "bar");
        rect.style.opacity = "0.9";

        setTimeout(() => {
            rect.setAttribute("y", y);
            rect.setAttribute("height", barHeight);
        }, 100 + (i * 50));

        // Tooltip (Bar)
        rect.addEventListener('mousemove', (e) => showTooltip(e, d.year, d.saldo, "Saldo", "#1ba77b"));
        rect.addEventListener('mouseleave', hideTooltip);

        svg.appendChild(rect);

        // Year Label
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x + (barWidth / 2));
        label.setAttribute("y", 148);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#888");
        label.setAttribute("font-size", "9");
        label.setAttribute("font-family", "Arial, sans-serif");
        label.textContent = d.year;
        svg.appendChild(label);
    });

    // --- 2. DRAW LINE (Flujo) ---
    let points = "";

    data.forEach((d, i) => {
        const slotWidth = (width - margin * 2) / data.length;
        // Center the point in the slot
        const x = margin + (i * slotWidth) + (slotWidth / 2);
        const y = (height - 10) - ((d.flujo / maxVal) * (height - 30));
        points += `${x},${y} `;

        // Draw Dots
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3.5);
        circle.setAttribute("class", "dot-point");
        circle.style.opacity = "0"; // Fade in later

        // Tooltip (Dot)
        circle.addEventListener('mousemove', (e) => showTooltip(e, d.year, d.flujo, "Flujo", "#003170"));
        circle.addEventListener('mouseleave', hideTooltip);

        setTimeout(() => circle.style.opacity = "1", 1500);
        svg.appendChild(circle);
    });

    // Draw Polyline
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", points);
    polyline.setAttribute("class", "line-path");

    // Insert line before dots
    const firstCircle = svg.querySelector('circle');
    if (firstCircle) svg.insertBefore(polyline, firstCircle);


    // --- HELPERS ---
    function showTooltip(e, year, value, type, color) {
        const rectPos = svg.getBoundingClientRect();
        // Adjust for tooltip width relative to mouse
        const mouseX = e.clientX - rectPos.left;
        const mouseY = e.clientY - rectPos.top;

        tooltip.style.left = mouseX + 'px';
        tooltip.style.top = (mouseY - 40) + 'px';
        tooltip.classList.remove('hidden');
        tooltip.querySelector('.tt-label').innerHTML = `${monthName} ${year} <span style="color:${color}">● ${type}</span>`;
        tooltip.querySelector('.tt-value').innerText = `$ ${value.formatMoney(2)}`;
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initFiraViz);