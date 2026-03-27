const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const glossOverlay = document.getElementById('glossary-overlay');
const victoryOverlay = document.getElementById('victory-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameState = 'swinging'; 
let angle = 0;
let angleDir = 0.025;
let clawLength = 60;
let launchSpeed = 12;
let caughtItem = null;
let bossDefeated = false;
const minerPos = { x: canvas.width / 2, y: 80 };

const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#f1c40f", size: 20 },
    { name: "Silver (Ag)", type: "Element", color: "#bdc3c7", size: 18 },
    { name: "Water (H2O)", type: "Compound", color: "#3498db", size: 25 },
    { name: "Salt (NaCl)", type: "Compound", color: "#ecf0f1", size: 22 },
    { name: "Brass Alloy", type: "Mixture", color: "#d35400", size: 30 },
    { name: "Granite", type: "Mixture", color: "#7f8c8d", size: 35 }
];

let items = [];

function initItems() {
    items = [];
    while (items.length < 10) {
        let newItem = {
            x: Math.random() * (canvas.width - 150) + 75,
            y: Math.random() * (canvas.height - 400) + 250,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)]
        };
        let tooClose = items.some(item => Math.hypot(item.x - newItem.x, item.y - newItem.y) < 80);
        if (!tooClose) items.push(newItem);
    }
}

function drawMiner(x, y) {
    ctx.strokeStyle = "#bdc3c7"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.stroke();
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#e74c3c" : "#34495e";
    ctx.fillRect(x - 25, y - 15, 50, 30);
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#ff7675" : "#55efc4";
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#440000" : "#2c3e50"; 
    ctx.fillRect(0, 0, canvas.width, 120);
    drawMiner(minerPos.x, minerPos.y);

    if (gameState !== 'boss' && gameState !== 'victory') {
        items.forEach(item => {
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); ctx.arc(item.x, item.y, item.data.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
            ctx.fillText(item.data.name, item.x, item.y + item.data.size + 15);
        });
        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.fillStyle = "#95a5a6"; ctx.fillRect(endX - 15, endY, 30, 15);
    }
    update();
    requestAnimationFrame(draw);
}

function update() {
    if (score >= 500 && !bossDefeated && gameState === 'swinging') {
        startBossLevel();
        return;
    }
    if (gameState === 'swinging') {
        angle += angleDir;
        if (Math.abs(angle) > 1.3) angleDir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        items.forEach((item, index) => {
            let dx = (minerPos.x + Math.sin(angle) * clawLength) - item.x;
            let dy = (minerPos.y + Math.cos(angle) * clawLength) - item.y;
            if (Math.hypot(dx, dy) < item.data.size + 15) {
                caughtItem = item; items.splice(index, 1); gameState = 'returning';
            }
        });
        if (clawLength > canvas.height - 50) gameState = 'returning';
    } else if (gameState === 'returning') {
        clawLength -= launchSpeed;
        if (caughtItem) {
            caughtItem.x = minerPos.x + Math.sin(angle) * clawLength;
            caughtItem.y = minerPos.y + Math.cos(angle) * clawLength;
        }
        if (clawLength <= 60) {
            if (caughtItem) startQuiz(caughtItem.data);
            else gameState = 'swinging';
            caughtItem = null;
        }
    }
}

function startBossLevel() {
    gameState = 'boss';
    quizOverlay.style.display = 'block';
    const bossPool = [
        { q: "? Fe + ? O₂ → 2 Fe₂O₃", opts: ["4 Fe + 3 O₂", "2 Fe + 3 O₂"], c: "4 Fe + 3 O₂" },
        { q: "? H₂ + ? O₂ → 2 H₂O", opts: ["2 H₂ + 1 O₂", "1 H₂ + 2 O₂"], c: "2 H₂ + 1 O₂" }
    ];
    let p = bossPool[Math.floor(Math.random() * bossPool.length)];
    document.getElementById('quiz-title').innerText = "⚠️ BOSS LEVEL";
    document.getElementById('quiz-desc').innerHTML = `<div class="equation">${p.q}</div>`;
    optionsDiv.innerHTML = '';
    p.opts.forEach(o => {
        let b = document.createElement('button');
        b.innerText = o;
        b.onclick = () => {
            if (o === p.c) { bossDefeated = true; score += 1000; checkAnswer(true); }
            else { score -= 100; alert("Unbalanced!"); }
        };
        optionsDiv.appendChild(b);
    });
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    document.getElementById('quiz-title').innerText = `Scanning: ${data.name}`;
    document.getElementById('quiz-desc').innerText = "Classify this matter:";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let btn = document.createElement('button');
        btn.innerText = choice;
        btn.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) { 
        if (!bossDefeated) score += 100;
        angleDir += (angleDir > 0) ? 0.003 : -0.003;
    } else { score -= 50; }
    document.getElementById('score').innerText = `Score: ${score}`;
    quizOverlay.style.display = 'none';
    if (bossDefeated) showVictoryScreen();
    else { gameState = 'swinging'; if (items.length < 4) initItems(); }
}

function showVictoryScreen() {
    gameState = 'victory';
    document.getElementById('final-score-display').innerText = `Final Score: ${score}`;
    victoryOverlay.style.display = 'block';
    let hs = JSON.parse(localStorage.getItem('molMinerScores')) || [];
    let name = prompt("High Score! Initials:", "AAA") || "UNK";
    hs.push({ name: name.toUpperCase().slice(0,3), score: score });
    hs.sort((a,b) => b.score - a.score);
    hs = hs.slice(0,5);
    localStorage.setItem('molMinerScores', JSON.stringify(hs));
    document.getElementById('leaderboard-list').innerHTML = hs.map(s => `<li>${s.name} ... ${s.score}</li>`).join('');
}

function toggleGlossary(s) { glossOverlay.style.display = s ? 'block' : 'none'; }
window.addEventListener('mousedown', () => { if (gameState === 'swinging') gameState = 'launching'; });
window.addEventListener('touchstart', () => { if (gameState === 'swinging') gameState = 'launching'; });

initItems();
draw();
