const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let studentName = "";
let score = 0;
let combo = 1; 
let timeLeft = 300; 
let gameState = 'waiting'; 
let angle = 0;
let angleDir = 0.035;
let clawLength = 80;
let currentClawSize = 18;
const baseClawSize = 18;
let launchSpeed = 18;
let caughtItem = null;
let bossDefeated = false;
let shakeAmount = 0;
let isFrozen = false;
const minerPos = { x: canvas.width / 2, y: 150 };

const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#FFD700", textColor: "#000", size: 45, glow: "#FFF5B7" },
    { name: "Silver (Ag)", type: "Element", color: "#E0E0E0", textColor: "#000", size: 40, glow: "#FFFFFF" },
    { name: "Water (H2O)", type: "Compound", color: "#00BFFF", textColor: "#fff", size: 48, glow: "#87CEFA" },
    { name: "Salt (NaCl)", type: "Compound", color: "#FFFFFF", textColor: "#333", size: 45, glow: "#F0F0F0" },
    { name: "Brass", type: "Mixture", color: "#CD7F32", textColor: "#fff", size: 52, glow: "#FFD39B" },
    { name: "Granite", type: "Mixture", color: "#808080", textColor: "#fff", size: 55, glow: "#A9A9A9" }
];

let items = [];
let particles = [];
let bgStars = [];
let floatingTexts = [];
let powerUps = [];

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = (Math.random() - 0.5) * 4;
        this.speedY = (Math.random() - 0.5) * 4;
        this.color = color;
        this.alpha = 1;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= 0.02; }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class PowerUp {
    constructor() {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = -50;
        this.type = Math.random() > 0.5 ? 'FREEZE' : 'MAGNET';
        this.color = this.type === 'FREEZE' ? '#00fbff' : '#ffcf00';
    }
    update() { this.y += 2.5; }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
        ctx.fillText(this.type[0], this.x, this.y + 5);
    }
}

function startGame() {
    studentName = document.getElementById('student-name').value || "Hero";
    document.getElementById('user-display').innerText = studentName;
    document.getElementById('start-overlay').style.display = 'none';
    gameState = 'swinging';
    initBG();
    initItems();
    startTimer();
    playSound('bgMusic');
    setInterval(() => { if(gameState === 'swinging') powerUps.push(new PowerUp()); }, 15000);
}

function initItems() {
    items = [];
    for(let i=0; i<12; i++) {
        items.push({
            x: Math.random() * (canvas.width - 200) + 100,
            y: Math.random() * (canvas.height - 400) + 350,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)],
            pulse: Math.random() * 6
        });
    }
}

function initBG() {
    for(let i=0; i<80; i++) bgStars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2});
}

function draw() {
    ctx.save();
    if (shakeAmount > 0) { ctx.translate(Math.random()*shakeAmount, Math.random()*shakeAmount); shakeAmount *= 0.9; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bgStars.forEach(star => {
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(star.x, star.y, star.s, 0, Math.PI*2); ctx.fill();
        star.y += 0.3; if(star.y > canvas.height) star.y = 0;
    });

    particles.forEach((p, i) => { p.update(); p.draw(); if(p.alpha <= 0) particles.splice(i, 1); });

    powerUps.forEach((pu, i) => { 
        pu.update(); pu.draw(); 
        if(pu.y > canvas.height) powerUps.splice(i, 1); 
    });

    floatingTexts.forEach((ft, i) => {
        ctx.fillStyle = ft.color; ctx.font = "bold 25px Arial"; ctx.globalAlpha = ft.alpha;
        ctx.fillText(ft.text, ft.x, ft.y); ft.y -= 1.5; ft.alpha -= 0.01;
        if(ft.alpha <= 0) floatingTexts.splice(i, 1);
    });

    // Miner UI
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath(); ctx.roundRect(minerPos.x - 30, minerPos.y - 40, 60, 50, 10); ctx.fill();

    if (gameState !== 'boss' && gameState !== 'victory' && gameState !== 'waiting') {
        items.forEach(item => {
            item.pulse += 0.05;
            let s = item.data.size + Math.sin(item.pulse) * 3;
            ctx.shadowBlur = 15; ctx.shadowColor = item.data.glow;
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); ctx.arc(item.x, item.y, s, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = item.data.textColor;
            ctx.font = `bold ${item.data.size * 0.38}px Arial`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(item.data.name, item.x, item.y);
        });

        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        
        ctx.strokeStyle = "white"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.fillStyle = "#FFD93D"; ctx.beginPath(); ctx.arc(endX, endY, currentClawSize, 0, Math.PI * 2); ctx.fill();
        
        if(gameState === 'launching' || gameState === 'returning') particles.push(new Particle(endX, endY, "#FFD93D"));
    }
    
    ctx.restore();
    update();
    requestAnimationFrame(draw);
}

function update() {
    if (score >= 1500 && !bossDefeated && gameState === 'swinging') { startBossLevel(); return; }
    
    if (gameState === 'swinging') {
        angle += angleDir;
        if (Math.abs(angle) > 1.3) angleDir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        let ex = minerPos.x + Math.sin(angle) * clawLength;
        let ey = minerPos.y + Math.cos(angle) * clawLength;

        powerUps.forEach((pu, i) => {
            if(Math.hypot(ex - pu.x, ey - pu.y) < 30) {
                powerUps.splice(i, 1);
                applyPowerUp(pu.type);
            }
        });

        items.forEach((item, index) => {
            if (Math.hypot(ex - item.x, ey - item.y) < item.data.size) {
                caughtItem = item; items.splice(index, 1); gameState = 'returning';
                shakeAmount = 8; playSound('catch');
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

function applyPowerUp(type) {
    playSound('powerup');
    if(type === 'FREEZE') {
        isFrozen = true;
        floatingTexts.push({text: "TIME FROZEN!", x: minerPos.x, y: minerPos.y, alpha: 1, color: "#00fbff"});
        setTimeout(() => isFrozen = false, 8000);
    } else {
        currentClawSize = 45;
        floatingTexts.push({text: "MAGNET CLAW!", x: minerPos.x, y: minerPos.y, alpha: 1, color: "#ffcf00"});
        setTimeout(() => currentClawSize = baseClawSize, 10000);
    }
}

function checkAnswer(isCorrect) {
    const comboEl = document.getElementById('combo-display');
    if (isCorrect) {
        playSound('correct');
        let gain = 100 * combo; score += gain;
        floatingTexts.push({text: `+${gain}`, x: minerPos.x, y: minerPos.y, alpha: 1, color: "#6BCB77"});
        combo++; comboEl.innerText = `🔥 COMBO X${combo}`; comboEl.style.display = 'block';
    } else {
        playSound('wrong');
        score -= 50; combo = 1; comboEl.style.display = 'none';
        shakeAmount = 15;
    }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
    quizOverlay.style.display = 'none';
    gameState = 'swinging';
    if (items.length < 4) initItems();
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    document.getElementById('quiz-title').innerText = `✨ Scanned ${data.name}!`;
    document.getElementById('quiz-desc').innerText = "Identify the matter type:";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let b = document.createElement('button'); b.innerText = choice;
        b.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(b);
    });
}

function startTimer() {
    setInterval(() => {
        if (gameState !== 'waiting' && gameState !== 'victory' && !isFrozen) {
            timeLeft--;
            let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
            document.getElementById('timer').innerText = `⏰ Time: ${m}:${s < 10 ? '0' : ''}${s}`;
            if (timeLeft <= 0) showVictoryScreen();
        }
    }, 1000);
}

function showVictoryScreen() { gameState = 'victory'; document.getElementById('victory-overlay').style.display = 'block'; }
function toggleGlossary(s) { document.getElementById('glossary-overlay').style.display = s ? 'block' : 'none'; }
window.addEventListener('mousedown', () => { if (gameState === 'swinging') { gameState = 'launching'; playSound('launch'); } });

draw();
