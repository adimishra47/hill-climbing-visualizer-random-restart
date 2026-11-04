const X_MIN = 0, X_MAX = 100;
const NEIGHBOR_OFFSETS = [-2, -1, 1, 2];

function bump(x, center, width) {
    return Math.exp(-Math.pow((x - center) / width, 2));
}

function fitness(x) {
    return 10 + 45 * bump(x, 18, 7) + 30 * bump(x, 42, 6) + 60 * bump(x, 68, 9) + 35 * bump(x, 90, 5) + 4 * Math.sin(x * 0.7);
}

let globalX = X_MIN, fMin = Infinity, fMax = -Infinity;
const localMaxima = [];
for (let x = X_MIN; x <= X_MAX; x++) {
    const f = fitness(x);
    if (f > fMax) { 
        fMax = f;
        globalX = x; 
    }
    if (f < fMin) 
        fMin = f;
    const isLocal = NEIGHBOR_OFFSETS.every(d => {
        const nx = x + d;
        return nx < X_MIN || nx > X_MAX || fitness(nx) <= f;
    });
    if (isLocal) 
        localMaxima.push(x);
}

//Hill Climbing Code
function runHillClimbing(numRestarts) {
    const startTime = performance.now();
    const steps = [], summaries = [];
    let expandedTotal = 0, evalTotal = 0;

    for (let r = 0; r < numRestarts; r++) {
        //Random Restart Part
        let x = X_MIN + Math.floor(Math.random() * (X_MAX - X_MIN + 1));
        let f = fitness(x); 
        evalTotal++;
        const startX = x, path = [{ x, f }];
        let expanded = 0;

        for (let iter = 0; iter < 500; iter++) {
            const neighbors = [];
            for (const d of NEIGHBOR_OFFSETS) {
                const nx = x + d;
                if (nx < X_MIN || nx > X_MAX) 
                    continue;
                neighbors.push({ x: nx, f: fitness(nx) });
                evalTotal++;
            }
            expanded++;
            expandedTotal++;

            let best = neighbors[0];
            for (const n of neighbors) 
                if (n.f > best.f) 
                    best = n;
            const improves = best.f > f;

            steps.push({
                restart: r, x, f, neighbors, bestNeighborX: improves ? best.x : null,
                stuck: !improves, path: path.slice(), expandedTotal, evalTotal
            });

            if (!improves) 
                break;
            x = best.x; 
            f = best.f; 
            path.push({ x, f });
        }

        summaries.push({
            restart: r, start: startX, final: x, fitness: f, expanded,
            pathLength: path.length - 1, path,
            result: f >= fMax - 1e-9 ? "Global Maximum" : "Local Maximum",
            lastStepIndex: steps.length - 1
        });
    }
    return { 
        steps, summaries, time: performance.now() - startTime 
    };
}

let sim = null, idx = 0, playing = false, timer = null;
const $ = id => document.getElementById(id);
const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#008080", "#9a6324", "#f032e6", "#808000", "#000075"];

const canvas = $("canvas"), ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height, PAD_L = 45, PAD_R = 20, PAD_T = 20, PAD_B = 35;
const sx = x => PAD_L + (x - X_MIN) / (X_MAX - X_MIN) * (W - PAD_L - PAD_R);
const sy = f => H - PAD_B - (f - fMin) / (fMax - fMin) * (H - PAD_T - PAD_B - 15);

function drawLandscape() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#94a3b8"; 
    ctx.fillStyle = "#475569"; 
    ctx.font = "12px Arial"; 
    ctx.lineWidth = 1;
    ctx.beginPath(); 
    ctx.moveTo(PAD_L, PAD_T); 
    ctx.lineTo(PAD_L, H - PAD_B); 
    ctx.lineTo(W - PAD_R, H - PAD_B); 
    ctx.stroke();
    for (let x = 0; x <= 100; x += 10) 
        ctx.fillText(x, sx(x) - 8, H - PAD_B + 16);
    ctx.fillText("Search position (x)", W / 2 - 50, H - 6);
    ctx.save(); 
    ctx.translate(14, H / 2 + 40); 
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Fitness f(x)", 0, 0); 
    ctx.restore();

    ctx.strokeStyle = "#64748b"; 
    ctx.lineWidth = 2; 
    ctx.beginPath();
    for (let x = X_MIN; x <= X_MAX; x += 0.5) {
        const px = sx(x), py = sy(fitness(x));
        x === X_MIN ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    for (const x of localMaxima) {
        const px = sx(x), py = sy(fitness(x)) - 6;
        ctx.beginPath(); 
        ctx.moveTo(px, py - 7); 
        ctx.lineTo(px - 5, py); 
        ctx.lineTo(px + 5, py); 
        ctx.fill();
    }
    ctx.fillStyle = "#eab308"; 
    ctx.font = "22px Arial";
    ctx.fillText("★", sx(globalX) - 9, sy(fMax) - 10);
}

function drawPath(step, lift, color, thick) {
    const pts = step.path.map(p => [sx(p.x), sy(p.f) - lift]);
    ctx.beginPath(); 
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    if (thick) { 
        ctx.strokeStyle = "#facc15";
         ctx.lineWidth = 9; 
         ctx.globalAlpha = 0.6; 
         ctx.stroke(); ctx.globalAlpha = 1; 
    }
    ctx.strokeStyle = color; 
    ctx.lineWidth = 3; 
    ctx.stroke();
    const [x0, y0] = pts[0];
    ctx.fillStyle = "white"; 
    ctx.lineWidth = 2; 
    ctx.beginPath(); 
    ctx.arc(x0, y0, 5, 0, 7); 
    ctx.fill(); 
    ctx.stroke();
    const [x1, y1] = pts[pts.length - 1];
    if (step.stuck) { 
        ctx.fillStyle = color; 
        ctx.fillRect(x1 - 5, y1 - 5, 10, 10); 
    }
}

function draw() {
    drawLandscape();
    const latest = {};
    for (let i = 0; i <= idx; i++) 
        latest[sim.steps[i].restart] = sim.steps[i];
    const best = bestFinished();
    for (const r in latest) 
        drawPath(latest[r], 4 + r * 2, COLORS[r], best && best.restart == r);
    const cur = sim.steps[idx];
    ctx.fillStyle = COLORS[cur.restart]; 
    ctx.strokeStyle = "black"; 
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.arc(sx(cur.x), sy(cur.f) - 4 - cur.restart * 2, 8, 0, 7); 
    ctx.fill(); 
    ctx.stroke();
}

function finishedSummaries() { 
    return sim.summaries.filter(s => s.lastStepIndex <= idx); 
}
function bestFinished() {
    let best = null;
    for (const s of finishedSummaries()) 
        if (!best || s.fitness > best.fitness) 
            best = s;
    return best;
}

function updatePanels() {
    const s = sim.steps[idx], last = idx === sim.steps.length - 1;
    const status = last ? "Completed" : s.stuck ? "Local Maximum Found" : "Searching";
    $("stRestart").textContent = `${s.restart + 1} of ${sim.summaries.length}`;
    $("stPos").textContent = s.x;
    $("stFit").textContent = s.f.toFixed(2);
    $("stStatus").textContent = status;

    $("frontierList").innerHTML = s.neighbors.map(n => {
        const isBest = n.x === s.bestNeighborX;
        return `<li class="${isBest ? "best" : ""}">x = ${n.x}, f = ${n.f.toFixed(2)}${isBest ? " ← best, move here" : ""}</li>`;
    }).join("") + (s.stuck ? `<li>No neighbor is better than ${s.f.toFixed(2)}: STUCK</li>` : "");

    $("visitedList").innerHTML = s.path.map(p => `<span class="chip">${p.x}</span>`).join("");

    const best = bestFinished();
    $("sRestarts").textContent = sim.summaries.length;
    $("sExpanded").textContent = s.expandedTotal;
    $("sEvals").textContent = s.evalTotal;
    $("sBestFit").textContent = best ? best.fitness.toFixed(2) : "-";
    $("sBestPos").textContent = best ? best.final : "-";
    $("sGlobal").textContent = `x = ${globalX}, f = ${fMax.toFixed(2)}`;
    $("sTime").textContent = sim.time.toFixed(3) + " ms (algorithm run)";

    $("tableBody").innerHTML = finishedSummaries().map(r => `
    <tr><td><span class="dot" style="background:${COLORS[r.restart]}"></span>${r.restart + 1}</td>
    <td>${r.start}</td><td>${r.final}</td><td>${r.fitness.toFixed(2)}</td>
    <td>${r.expanded}</td><td>${r.pathLength}</td>
    <td class="${r.result === "Global Maximum" ? "global" : "local"}">${r.result}</td></tr>`).join("");

    $("backBtn").disabled = idx === 0;
    $("forwardBtn").disabled = last;
    $("playBtn").disabled = playing;
    $("pauseBtn").disabled = !playing;
}

function render() {
    draw();
    updatePanels();
}

function delay() {
    return 1000 / Number($("speedInput").value);

}

function tick() {
    if (!playing) return;
    if (idx < sim.steps.length - 1) { idx++; render(); timer = setTimeout(tick, delay()); }
    else pause();
}
function play() {
    if (playing) return;
    if (idx >= sim.steps.length - 1) idx = 0;      // replay from the beginning if finished
    playing = true; render(); timer = setTimeout(tick, delay());
}
function pause() { 
    playing = false;
    clearTimeout(timer);
    render(); 
}
function stepForward() { 
    pause(); 
    if (idx < sim.steps.length - 1) 
        idx++; 
    render(); 
}
function stepBack() { 
    pause(); 
    if (idx > 0) 
        idx--; 
    render(); 
}
function reset() {
    playing = false; clearTimeout(timer);
    sim = runHillClimbing(Number($("restartsInput").value));
    idx = 0;
    $("restartLegend").innerHTML = sim.summaries.map(s =>
        `<span><span class="dot" style="background:${COLORS[s.restart]}"></span>R${s.restart + 1}</span>`).join(" ");
    render();
}

$("playBtn").onclick = play;
$("pauseBtn").onclick = pause;
$("forwardBtn").onclick = stepForward;
$("backBtn").onclick = stepBack;
$("resetBtn").onclick = reset;
$("restartsInput").oninput = () => { $("restartsValue").textContent = $("restartsInput").value; reset(); };
$("speedInput").oninput = () => { $("speedValue").textContent = $("speedInput").value + "x"; };

reset();