const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const glossOverlay = document.getElementById('glossary-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- GAME STATE ---
let score = 0;
let gameState = 'swinging'; 
let angle = 0;
let angleDir = 0.025; // Speed of swing
let clawLength = 60;
let launchSpeed = 12;
let caughtItem = null;
let bossDefeated = false;
const minerPos = { x: canvas.width / 2, y: 80 };

// --- DATA: TEKS 8.6 MATTERS ---
const matterTypes = [
    { name: "Gold (Au)", type: "Element", color: "#f1c40f", size: 20 },
    { name: "Silver (Ag)", type: "Element", color: "#bdc3c7", size: 18 },
    { name: "Water (H2O)", type: "Compound", color: "#3498db", size: 25 },
    { name: "Salt (NaCl)", type: "Compound", color: "#ecf0f1", size: 22 },
    { name: "Brass Alloy", type: "Mixture", color: "#d35400", size: 30 },
    { name: "Granite", type: "Mixture", color: "#7f8c8d", size: 35 }
];

let items = [];

// --- INITIALIZATION ---
function initItems() {
    items = [];
    while (items.length < 10) {
        let newItem = {
            x: Math.random() * (canvas.width - 150) + 75,
            y: Math.random() * (canvas.height - 400) + 250,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)]
        };
        
        // Prevent overlapping for better readability
        let tooClose = items.some(item => {
            let dx = item.x - newItem.x;
            let dy = item.y - newItem.y;
            return Math.sqrt(dx*dx + dy*dy) < 80; 
        });

        if (!tooClose) items.push(newItem);
    }
}

// --- DRAWING FUNCTIONS ---
function drawMiner(x, y) {
    // Drone Arms
    ctx.strokeStyle = "#bdc3c7";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y);
    ctx.stroke();

    // Drone Body (Turns red in Boss Mode)
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#e74c3c" : "#34495e";
    ctx.roundRect(x - 25, y - 15, 50, 30, 5);
    ctx.fill();
    
    // Glowing Science Sensor
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#ff7675" : "#55efc4";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Top UI Bar
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#c0392b" : "#2c3e50"; 
    ctx.fillRect(0, 0, canvas.width, 120);
    
    drawMiner(minerPos.x, minerPos.y);

    if (gameState !== 'boss') {
        items.forEach(item => {
            // Draw Matter
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); ctx.arc(item.x, item.y, item.data.size, 0, Math.PI * 2); ctx.fill();
            // Draw Label
            ctx.fillStyle = "white"; 
            ctx.font = "bold 13px Arial"; 
            ctx.textAlign = "center";
            ctx.fillText(item.data.name, item.x, item.y + item.data.size + 15);
        });

        // Draw Claw & Line
        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        
        // Mechanical Claw Head
        ctx.fillStyle = "#95a5a6"; 
        ctx.fillRect(endX - 15, endY, 30, 15);
    }

    update();
    requestAnimationFrame(draw);
}

// --- LOGIC ---
function update() {
    if (score >= 500 && !bossDefeated && gameState !== 'quiz' && gameState !== 'boss') {
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
            if (Math.sqrt(dx*dx + dy*dy) < item.data.size + 15) {
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
        { q: "? Fe + ? O₂ → 2 Fe₂O₃", options: ["4 Fe + 3 O₂", "2 Fe + 3 O₂", "3 Fe + 2 O₂"], correct: "4 Fe + 3 O₂" },
        { q: "? H₂ + ? O₂ → 2 H₂O", options: ["2 H₂ + 1 O₂", "1 H₂ + 2 O₂", "2 H₂ + 2 O₂"], correct: "2 H₂ + 1 O₂" }
    ];
    
    let picked = bossPool[Math.floor(Math.random() * bossPool.length)];
    
    document.getElementById('quiz-title').innerText = `⚠️ BOSS LEVEL: Emergency Balancing`;
    document.getElementById('quiz-desc').innerHTML = `Balance the atoms to stabilize the mine!<br><div class="equation">${picked.q}</div>`;
    optionsDiv.innerHTML = '';
    
    picked.options.forEach(opt => {
        let btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === picked.correct) {
                bossDefeated = true; score += 1000;
                alert("MISSION ACCOMPLISHED! Mass is conserved!");
                checkAnswer(true);
            } else {
                score -= 100; alert("ERROR: Atoms are not balanced!");
            }
        };
        optionsDiv.appendChild(btn);
    });
}

function toggleGlossary(show) {
    glossOverlay.style.display = show ? 'block' : 'none';
}

function startQuiz(data) {
    gameState = 'quiz';
    quizOverlay.style.display = 'block';
    if (Math.random() > 0.8) showConservationQuiz();
    else showClassificationQuiz(data);
}

function showClassificationQuiz(data) {
    document.getElementById('quiz-title').innerText = `Scanning: ${data.name}`;
    document.getElementById('quiz-desc').innerText = "Select the correct classification:";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let btn = document.createElement('button');
        btn.innerText = choice;
        btn.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(btn);
    });
}

function showConservationQuiz() {
    const eqs = [
        { q: "N₂ + 3 H₂ → 2 NH₃", a: true },
        { q: "CH₄ + O₂ → CO₂ + H₂O", a: false },
        { q: "2 Na + Cl₂ → 2 NaCl", a: true }
    ];
    let picked = eqs[Math.floor(Math.random() * eqs.length)];
    document.getElementById('quiz-title').innerText = `Conservation Check!`;
    document.getElementById('quiz-desc').innerHTML = `Is this equation balanced?<br><div class="equation">${picked.q}</div>`;
    optionsDiv.innerHTML = '';
    [{t:"Yes (Balanced)", v:true}, {t:"No (Unbalanced)", v:false}].forEach(opt => {
        let btn = document.createElement('button');
        btn.innerText = opt.t;
        btn.onclick = () => checkAnswer(opt.v === picked.a);
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect && gameState !== 'boss') { 
        score += 100;
        // Tailor: Difficulty increases slightly with every win
        angleDir += (angleDir > 0) ? 0.002 : -0.002;
    } else if (!isCorrect) { 
        score -= 50; 
    }
    document.getElementById('score').innerText = `Score: ${score}`;
    quizOverlay.style.display = 'none';
    gameState = 'swinging';
    if (items.length < 4) initItems();
}

window.addEventListener('mousedown', () => { if (gameState === 'swinging') gameState = 'launching'; });
window.addEventListener('touchstart', () => { if (gameState === 'swinging') gameState = 'launching'; });

initItems();
draw();
