const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Game State Variables ---
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
let bossActive = false;
let shakeAmount = 0;
let isFrozen = false;
const minerPos = { x: canvas.width / 2, y: 150 };

// --- Boss Battle Variables ---
let boss = { x: canvas.width / 2, y: canvas.height - 150, hp: 100, targetElement: "Oxygen", dir: 2 };
let projectiles = [];

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

// --- Classes ---
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

class Projectile {
    constructor(x, y, angle, data) {
        this.x = x; this.y = y;
        this.angle = angle;
        this.speed = 12;
        this.data = data; // The element being "shot"
    }
    update() {
        this.x += Math.sin(this.angle) * this.speed;
        this.y += Math.cos(this.angle) * this.speed;
    }
    draw() {
        ctx.fillStyle = this.data.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.stroke();
    }
}

// --- core Functions ---
function startGame() {
    studentName = document.getElementById('student-name').value || "Hero";
    document.getElementById('user-display').innerText = studentName;
    document.getElementById('start-overlay').style.display = 'none';
    gameState = 'swinging';
    initBG();
    initItems();
    startTimer();
    if(typeof playSound === 'function') playSound('bgMusic');
    setInterval(() => { if(gameState === 'swinging') powerUps.push({x: Math.random()*canvas.width, y: -50, type: Math.random() > 0.5 ? 'FREEZE' : 'MAGNET'}); }, 20000);
}

function initItems() {
    items = [];
    for(let i=0; i<10; i++) {
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

    // Stars
    bgStars.forEach(star => {
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(star.x, star.y, star.s, 0, Math.PI*2); ctx.fill();
        star.y += 0.3; if(star.y > canvas.height) star.y = 0;
    });

    particles.forEach((p, i) => { p.update(); p.draw(); if(p.alpha <= 0) particles.splice(i, 1); });

    // Floating Texts
    floatingTexts.forEach((ft, i) => {
        ctx.fillStyle = ft.color; ctx.font = "bold 25px Arial"; ctx.globalAlpha = ft.alpha;
        ctx.fillText(ft.text, ft.x, ft.y); ft.y -= 1.5; ft.alpha -= 0.01;
        if(ft.alpha <= 0) floatingTexts.splice(i, 1);
    });

    if (bossActive) {
        drawBoss();
    } else if (gameState !== 'victory' && gameState !== 'waiting') {
        drawMiningPhase();
    }
    
    // Draw Miner
    ctx.fillStyle = "#FF6B6B";
    ctx.beginPath(); ctx.roundRect(minerPos.x - 30, minerPos.y - 40, 60, 50, 10); ctx.fill();

    ctx.restore();
    update();
    requestAnimationFrame(draw);
}

function drawMiningPhase() {
    items.forEach(item => {
        item.pulse += 0.05;
        let s = item.data.size + Math.sin(item.pulse) * 3;
        ctx.fillStyle = item.data.color;
        ctx.beginPath(); ctx.arc(item.x, item.y, s, 0, Math.PI * 2); ctx.fill();
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
}

function drawBoss() {
    // Draw Boss Molecule
    ctx.fillStyle = "#8e44ad";
    ctx.shadowBlur = 30; ctx.shadowColor = "#e74c3c";
    ctx.beginPath(); ctx.arc(boss.x, boss.y, 60, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Boss Info
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`BOSS HP: ${boss.hp}`, boss.x, boss.y - 80);
    ctx.fillStyle = "#FFD93D";
    ctx.fillText(`WANTED: ${boss.targetElement}`, boss.x, boss.y + 100);

    // Draw Projectiles
    projectiles.forEach((p, i) => {
        p.update(); p.draw();
        if (Math.hypot(p.x - boss.x, p.y - boss.y) < 60) {
            checkBossHit(p);
            projectiles.splice(i, 1);
        }
        if (p.y > canvas.height) projectiles.splice(i, 1);
    });

    // Draw "Cannon" direction
    let endX = minerPos.x + Math.sin(angle) * 60;
    let endY = minerPos.y + Math.cos(angle) * 60;
    ctx.strokeStyle = "#3498db"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
}

function update() {
    if (score >= 2000 && !bossActive) { startBossPhase(); }

    if (bossActive) {
        angle += angleDir;
        if (Math.abs(angle) > 1.3) angleDir *= -1;
        boss.x += boss.dir;
        if (boss.x > canvas.width - 100 || boss.x < 100) boss.dir *= -1;
    } else if (gameState === 'swinging') {
        angle += angleDir;
        if (Math.abs(angle) > 1.3) angleDir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        let ex = minerPos.x + Math.sin(angle) * clawLength;
        let ey = minerPos.y + Math.cos(angle) * clawLength;
        items.forEach((item, index) => {
            if (Math.hypot(ex - item.x, ey - item.y) < item.data.size) {
                caughtItem = item; items.splice(index, 1); gameState = 'returning';
            }
        });
        if (clawLength > canvas.height - 50) gameState = 'returning';
    } else if (gameState === 'returning') {
        clawLength -= launchSpeed;
        if (clawLength <= 80) {
            if (caughtItem) startQuiz(caughtItem.data);
            else gameState = 'swinging';
            caughtItem = null;
        }
    }
}

function startBossPhase() {
    bossActive = true;
    floatingTexts.push({text: "BOSS INBOUND!", x: canvas.width/2, y: canvas.height/2, alpha: 1, color: "red"});
}

function checkBossHit(p) {
    if (p.data.name.includes(boss.targetElement)) {
        boss.hp -= 20;
        shakeAmount = 20;
        score += 500;
        boss.targetElement = ["Gold", "Silver", "Water", "Salt"][Math.floor(Math.random()*4)];
        if (boss.hp <= 0) showVictoryScreen();
    } else {
        score -= 100;
        floatingTexts.push({text: "WRONG ELEMENT!", x: boss.x, y: boss.y, alpha: 1, color: "orange"});
    }
}

function checkAnswer(isCorrect) {
    if (isCorrect) { score += 100; combo++; } 
    else { score -= 50; combo = 1; }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
    quizOverlay.style.display = 'none';
    gameState = 'swinging';
    if (items.length < 4) initItems();
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    document.getElementById('quiz-title').innerText = `✨ Scanned ${data.name}!`;
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let b = document.createElement('button'); b.innerText = choice;
        b.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(b);
    });
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

function showVictoryScreen() { gameState = 'victory'; document.getElementById('victory-overlay').style.display = 'block'; }
function toggleGlossary(s) { document.getElementById('glossary-overlay').style.display = s ? 'block' : 'none'; }

window.addEventListener('mousedown', () => { 
    if (bossActive) {
        // Fire logic
        projectiles.push(new Projectile(minerPos.x, minerPos.y, angle, matterTypes[Math.floor(Math.random()*matterTypes.length)]));
        if(typeof playSound === 'function') playSound('launch');
    } else if (gameState === 'swinging') { 
        gameState = 'launching'; 
        if(typeof playSound === 'function') playSound('launch');
    } 
});

draw();
