const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const quizOverlay = document.getElementById('quiz-overlay');
const glossOverlay = document.getElementById('glossary-overlay');
const optionsDiv = document.getElementById('options');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameState = 'swinging'; 
let angle = 0;
let angleDir = 0.025;
let clawLength = 60;
let launchSpeed = 10;
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
    for (let i = 0; i < 10; i++) {
        items.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 350) + 250,
            data: matterTypes[Math.floor(Math.random() * matterTypes.length)]
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // UI Background
    ctx.fillStyle = (score >= 500 && !bossDefeated) ? "#c0392b" : "#5d4037"; 
    ctx.fillRect(0, 0, canvas.width, 120);
    
    // Character
    ctx.fillStyle = "white"; ctx.font = "40px Arial"; 
    ctx.fillText(score >= 500 && !bossDefeated ? "🛡️" : "👴", minerPos.x - 20, minerPos.y);

    if (gameState !== 'boss') {
        items.forEach(item => {
            ctx.fillStyle = item.data.color;
            ctx.beginPath(); ctx.arc(item.x, item.y, item.data.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.fillText(item.data.name, item.x - 25, item.y + 5);
        });

        let endX = minerPos.x + Math.sin(angle) * clawLength;
        let endY = minerPos.y + Math.cos(angle) * clawLength;
        ctx.strokeStyle = "#ecf0f1"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.fillStyle = "#95a5a6"; ctx.fillRect(endX - 12, endY, 24, 12);
    }

    update();
    requestAnimationFrame(draw);
}

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
            if (Math.sqrt(dx*dx + dy*dy) < item.data.size + 10) {
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
    document.getElementById('quiz-title').innerText = `🔥 BOSS LEVEL: Final Balancing`;
    document.getElementById('quiz-desc').innerHTML = `Balance this equation to save the mine!<br><div class="equation">? Fe + ? O₂ → 2 Fe₂O₃</div>`;
    optionsDiv.innerHTML = '';
    
    const bossOptions = [
        { t: "2 Fe + 3 O₂", v: false },
        { t: "4 Fe + 3 O₂", v: true },
        { t: "4 Fe + 2 O₂", v: false }
    ];

    bossOptions.forEach(opt => {
        let btn = document.createElement('button');
        btn.innerText = opt.t;
        btn.onclick = () => {
            if (opt.v) {
                bossDefeated = true; score += 1000;
                alert("CONGRATULATIONS! You saved the mine!");
                checkAnswer(true);
            } else {
                score -= 100; alert("Unbalanced! Try again.");
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
    document.getElementById('quiz-title').innerText = `Target: ${data.name}`;
    document.getElementById('quiz-desc').innerText = "Classify this matter:";
    optionsDiv.innerHTML = '';
    ["Element", "Compound", "Mixture"].forEach(choice => {
        let btn = document.createElement('button');
        btn.innerText = choice;
        btn.onclick = () => checkAnswer(choice === data.type);
        optionsDiv.appendChild(btn);
    });
}

function showConservationQuiz() {
    const eqs = [{ q: "Mg + O₂ → MgO", a: false }, { q: "2Mg + O₂ → 2MgO", a: true }];
    let picked = eqs[Math.floor(Math.random() * eqs.length)];
    document.getElementById('quiz-title').innerText = `Conservation Check!`;
    document.getElementById('quiz-desc').innerHTML = `Is this balanced?<br><div class="equation">${picked.q}</div>`;
    optionsDiv.innerHTML = '';
    [{t:"Yes", v:true}, {t:"No", v:false}].forEach(opt => {
        let btn = document.createElement('button');
        btn.innerText = opt.t;
        btn.onclick = () => checkAnswer(opt.v === picked.a);
        optionsDiv.appendChild(btn);
    });
}

function checkAnswer(isCorrect) {
    if (isCorrect && gameState !== 'boss') { score += 100; }
    else if (!isCorrect) { score -= 50; }
    document.getElementById('score').innerText = `Score: ${score}`;
    quizOverlay.style.display = 'none';
    gameState = 'swinging';
    if (items.length < 4) initItems();
}

window.addEventListener('mousedown', () => { if (gameState === 'swinging') gameState = 'launching'; });
window.addEventListener('touchstart', () => { if (gameState === 'swinging') gameState = 'launching'; });

initItems();
draw();
