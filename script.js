const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let studentName = "";
let score = 0;
let timeLeft = 300; 
let gameState = 'waiting'; 
let angle = 0;
let angleDir = 0.035;
let clawLength = 80;
let launchSpeed = 16;
let caughtItem = null;
let bossDefeated = false;
let timerStarted = false;
const minerPos = { x: canvas.width / 2, y: 150 };

const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#FFD700", textColor: "#000", size: 45, glow: "#FFF5B7" },
    { name: "Silver (Ag)", type: "Element", color: "#E0E0E0", textColor: "#000", size: 40, glow: "#FFFFFF" },
    { name: "Water (H2O)", type: "Compound", color: "#00BFFF", textColor: "#fff", size: 48, glow: "#87CEFA" },
    { name: "Salt (NaCl)", type: "Compound", color: "#FFFFFF", textColor: "#333", size: 45, glow: "#F0F0F0" },
    { name: "Brass", type: "Mixture", color: "#CD7F32", textColor: "#fff", size: 52, glow: "#FFD39B" },
    { name: "Granite", type: "Mixture", color: "#808080", textColor: "#fff", size: 55, glow: "#A9A9A9" }
];

const conservationQuests = [
    { eq: "4 Fe + ? O₂ → 2 Fe₂O₃", ans: "3", options: ["2", "3", "4"] },
    { eq: "CH₄ + 2 O₂ → CO₂ + ? H₂O", ans: "2", options: ["1", "2", "3"] },
    { eq: "2 H₂ + O₂ → ? H₂O", ans: "2", options: ["1", "2", "4"] },
    { eq: "N₂ + 3 H₂ → ? NH₃", ans: "2", options: ["1", "2", "3"] }
];

let items = [];

function startGame() {
    const input = document.getElementById('student-name').value;
    if (!input) return alert("Please enter your name!");
    studentName = input;
    document.getElementById('user-display').innerText = studentName;
    document.getElementById('start-overlay').style.display = 'none';
    gameState = 'swinging';
    initItems();
    if(!timerStarted) { startTimer(); timerStarted = true; }
}

function initItems() {
    items = [];
    for(let i=0; i<12; i++) {
        let newItem = {
            x: Math.random() * (canvas.width - 240) + 120,
            y: Math.random() * (canvas.height - 450) + 380,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)],
            pulse: Math.random() * Math.PI * 2
        };
        let tooClose = items.some(item => Math.hypot(item.x - newItem.x, item.y - newItem.y) < 130);
        if (!tooClose) items.push(newItem);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath(); ctx.roundRect(minerPos.x - 30, minerPos.y - 40, 60, 50, 10); ctx.fill();
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "red" : "#4D96FF"; 
    ctx.beginPath(); ctx.arc(minerPos.x - 8, minerPos.y - 18, 5, 0, Math.PI * 2); ctx.arc(minerPos.x + 8, minerPos.y - 18, 5, 0, Math.PI * 2); ctx.fill();

    if (gameState !== 'boss' && gameState !== 'victory' && gameState !== 'waiting') {
        items.forEach(item => {
            item.pulse += 0.04;
            let pulseSize = Math.sin(item.pulse) * 4;

            ctx.save();
            ctx.shadowBlur = 20 + pulseSize;
            ctx.shadowColor = item.data.glow;
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); 
            ctx.arc(item.x, item.y, item.data.size + pulseSize/2, 0, Math.PI * 2); 
            ctx.fill();
            ctx.restore();

            ctx.strokeStyle = "rgba(255,255,255,0.4)";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = item.data.textColor;
            ctx.font = `bold ${item.data.size * 0.38}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.data.name, item.x, item.y);
        });

        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.fillStyle = "#FFD93D"; ctx.beginPath(); ctx.arc(endX, endY, 15, 0, Math.PI * 2); ctx.fill();
    }
    update();
    requestAnimationFrame(draw);
}

function update() {
    if (score >= 500 && !bossDefeated && gameState === 'swinging') { startBossLevel(); return; }
    
    if (gameState === 'swinging') {
        angle += angleDir;
        if (Math.abs(angle) > 1.3) angleDir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        items.forEach((item, index) => {
            if (Math.hypot(minerPos.x + Math.sin(angle) * clawLength - item.x, minerPos.y + Math.cos(angle) * clawLength - item.y) < item.data.size) {
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
        if (clawLength <= 80) {
            if (caughtItem) startQuiz(caughtItem.data);
            else gameState = 'swinging';
            caughtItem = null;
        }
    }
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    document.getElementById('quiz-title').innerText = `Scanned ${data.name}!`;
    document.getElementById('quiz-desc').innerText = "Classify this matter:";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let b = document.createElement('button'); b.innerText = choice;
        b.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(b);
    });
}

function startBossLevel() {
    gameState = 'boss';
    quizOverlay.style.display = 'block';
    const quest = conservationQuests[Math.floor(Math.random() * conservationQuests.length)];
    document.getElementById('quiz-title').innerText = "⚖️ MASS CHALLENGE!";
    document.getElementById('quiz-desc').innerHTML = `Balance the equation:<br><div class='equation'>${quest.eq}</div>`;
    optionsDiv.innerHTML = '';
    quest.options.forEach(opt => {
        let b = document.createElement('button'); b.innerText = opt;
        b.onclick = () => { if (opt === quest.ans) { bossDefeated = true; score += 500; checkAnswer(true); } else { score -= 100; alert("Incorrect! Mass must be balanced."); }};
        optionsDiv.appendChild(b);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) { score += 100; angleDir *= 1.05; } else { score -= 50; }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
    quizOverlay.style.display = 'none';
    if (bossDefeated && gameState === 'boss') showVictoryScreen();
    else { gameState = 'swinging'; if (items.length < 5) initItems(); }
}

function startTimer() {
    setInterval(() => {
        if (gameState !== 'waiting' && gameState !== 'victory') {
            timeLeft--;
            let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
            document.getElementById('timer').innerText = `⏰ Time: ${m}:${s < 10 ? '0' : ''}${s}`;
            if (timeLeft <= 0) showVictoryScreen();
        }
    }, 1000);
}

function showVictoryScreen() {
    gameState = 'victory';
    document.getElementById('final-score-display').innerText = `Stars Earned: ${score}`;
    document.getElementById('victory-overlay').style.display = 'block';
    let hs = JSON.parse(localStorage.getItem('molMinerScores')) || [];
    hs.push({ name: studentName, score: score });
    hs.sort((a,b) => b.score - a.score);
    document.getElementById('leaderboard-list').innerHTML = hs.slice(0,5).map(s => `<li>${s.name}: ${s.score}</li>`).join('');
}

function toggleGlossary(s) { document.getElementById('glossary-overlay').style.display = s ? 'block' : 'none'; }
window.addEventListener('mousedown', () => { if (gameState === 'swinging') gameState = 'launching'; });
window.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'swinging') gameState = 'launching'; });

draw();
