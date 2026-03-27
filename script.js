const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('start-overlay');
const quizOverlay = document.getElementById('quiz-overlay');
const victoryOverlay = document.getElementById('victory-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let studentName = "";
let score = 0;
let timeLeft = 300; 
let gameState = 'waiting'; 
let angle = 0;
let angleDir = 0.03;
let clawLength = 70;
let launchSpeed = 14;
let caughtItem = null;
let bossDefeated = false;
let timerStarted = false;
const minerPos = { x: canvas.width / 2, y: 150 };

const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#FFD700", size: 22 },
    { name: "Silver (Ag)", type: "Element", color: "#C0C0C0", size: 20 },
    { name: "Water (H2O)", type: "Compound", color: "#00BFFF", size: 28 },
    { name: "Salt (NaCl)", type: "Compound", color: "#FFFFFF", size: 25 },
    { name: "Brass", type: "Mixture", color: "#CD7F32", size: 32 },
    { name: "Granite", type: "Mixture", color: "#808080", size: 35 }
];

// New Conservation of Mass Equations
const conservationQuests = [
    { eq: "4 Fe + ? O₂ → 2 Fe₂O₃", ans: "3", options: ["2", "3", "4"] },
    { eq: "CH₄ + 2 O₂ → CO₂ + ? H₂O", ans: "2", options: ["1", "2", "3"] },
    { eq: "2 H₂ + O₂ → ? H₂O", ans: "2", options: ["1", "2", "4"] },
    { eq: "N₂ + 3 H₂ → ? NH₃", ans: "2", options: ["2", "3", "6"] }
];

let items = [];

function startGame() {
    const input = document.getElementById('student-name').value;
    if (!input) { alert("Enter your name first!"); return; }
    studentName = input;
    document.getElementById('user-display').innerText = studentName;
    startOverlay.style.display = 'none';
    gameState = 'swinging';
    initItems();
    if(!timerStarted) { startTimer(); timerStarted = true; }
}

function initItems() {
    items = [];
    while (items.length < 10) {
        let newItem = {
            x: Math.random() * (canvas.width - 150) + 75,
            y: Math.random() * (canvas.height - 450) + 350,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)]
        };
        let tooClose = items.some(item => Math.hypot(item.x - newItem.x, item.y - newItem.y) < 90);
        if (!tooClose) items.push(newItem);
    }
}

function startTimer() {
    const timerLoop = setInterval(() => {
        if (gameState !== 'waiting' && gameState !== 'victory') {
            timeLeft--;
            let m = Math.floor(timeLeft / 60);
            let s = timeLeft % 60;
            document.getElementById('timer').innerText = `⏰ Time: ${m}:${s < 10 ? '0' : ''}${s}`;
            if (timeLeft <= 0) { clearInterval(timerLoop); showVictoryScreen(); }
        }
    }, 1000);
}

function drawMiner(x, y) {
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath(); ctx.roundRect(x - 30, y - 40, 60, 50, 10); ctx.fill();
    ctx.fillStyle = "white"; 
    ctx.beginPath(); ctx.roundRect(x - 20, y - 30, 40, 25, 5); ctx.fill();
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "red" : "#4D96FF"; 
    ctx.beginPath(); ctx.arc(x - 8, y - 18, 4, 0, Math.PI * 2); ctx.arc(x + 8, y - 18, 4, 0, Math.PI * 2); ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMiner(minerPos.x, minerPos.y);

    if (gameState !== 'boss' && gameState !== 'victory' && gameState !== 'waiting') {
        items.forEach(item => {
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); ctx.arc(item.x, item.y, item.data.size, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "white"; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
            ctx.fillText(item.data.name, item.x, item.y + 5);
        });

        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        ctx.strokeStyle = "white"; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.fillStyle = "#FFD93D"; ctx.beginPath(); ctx.arc(endX, endY, 15, 0, Math.PI * 2); ctx.fill();
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
        if (Math.abs(angle) > 1.2) angleDir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        items.forEach((item, index) => {
            if (Math.hypot(minerPos.x + Math.sin(angle) * clawLength - item.x, minerPos.y + Math.cos(angle) * clawLength - item.y) < item.data.size + 15) {
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
        if (clawLength <= 70) {
            if (caughtItem) startQuiz(caughtItem.data);
            else gameState = 'swinging';
            caughtItem = null;
        }
    }
}

function startBossLevel() {
    gameState = 'boss';
    quizOverlay.style.display = 'block';
    const quest = conservationQuests[Math.floor(Math.random() * conservationQuests.length)];
    
    document.getElementById('quiz-title').innerText = "⚖️ MASS CHALLENGE!";
    document.getElementById('quiz-desc').innerHTML = `Balance for the Law of Conservation:<br><div class='equation'>${quest.eq}</div>`;
    
    optionsDiv.innerHTML = '';
    quest.options.forEach(opt => {
        let b = document.createElement('button');
        b.innerText = opt;
        b.onclick = () => {
            if (opt === quest.ans) {
                bossDefeated = true;
                score += 500;
                checkAnswer(true);
            } else {
                score -= 100;
                alert("The atoms aren't balanced yet! Try again.");
                document.getElementById('score').innerText = `⭐ Points: ${score}`;
            }
        };
        optionsDiv.appendChild(b);
    });
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    document.getElementById('quiz-title').innerText = `Scanned ${data.name}!`;
    document.getElementById('quiz-desc').innerText = "What category of matter is this?";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let b = document.createElement('button'); b.innerText = choice;
        b.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(b);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect) { 
        score += 100; 
        angleDir += (angleDir > 0 ? 0.005 : -0.005); 
    } else { 
        score -= 50; 
    }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
    quizOverlay.style.display = 'none';
    if (bossDefeated) showVictoryScreen();
    else { gameState = 'swinging'; if (items.length < 4) initItems(); }
}

function showVictoryScreen() {
    gameState = 'victory';
    document.getElementById('final-score-display').innerText = `Stars Earned: ${score}`;
    victoryOverlay.style.display = 'block';
    let hs = JSON.parse(localStorage.getItem('molMinerScores')) || [];
    hs.push({ name: studentName, score: score });
    hs.sort((a,b) => b.score - a.score);
    hs = hs.slice(0,5);
    localStorage.setItem('molMinerScores', JSON.stringify(hs));
    document.getElementById('leaderboard-list').innerHTML = hs.map(s => `<li>${s.name}: ${s.score}</li>`).join('');
}

function toggleGlossary(s) { document.getElementById('glossary-overlay').style.display = s ? 'block' : 'none'; }
window.addEventListener('mousedown', () => { if (gameState === 'swinging') gameState = 'launching'; });
window.addEventListener('touchstart', (e) => { e.preventDefault(); if (gameState === 'swinging') gameState = 'launching'; });

draw();
