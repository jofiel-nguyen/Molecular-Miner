class Projectile {
    constructor(x, y, angle, data) {
        this.x = x; this.y = y; this.angle = angle;
        this.speed = 12; this.data = data;
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

function startGame() {
    studentName = document.getElementById('student-name').value || "Hero";
    document.getElementById('user-display').innerText = studentName;
    document.getElementById('start-overlay').style.display = 'none';
    gameState = 'swinging';
    initBG(); initItems(); startTimer();
    if(typeof playMusic === "function") playMusic(); 
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
    
    bgStars.forEach(star => {
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(star.x, star.y, star.s, 0, Math.PI*2); ctx.fill();
        star.y += 0.3; if(star.y > canvas.height) star.y = 0;
    });

    if (bossActive) drawBoss(); 
    else if (gameState !== 'victory' && gameState !== 'waiting') drawMiningPhase();

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
        ctx.font = `bold ${item.data.size * 0.35}px Arial`;
        ctx.textAlign = "center"; ctx.fillText(item.data.name, item.x, item.y + 5);
    });
    let endX = minerPos.x + Math.sin(angle) * clawLength;
    let endY = minerPos.y + Math.cos(angle) * clawLength;
    ctx.strokeStyle = "white"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(minerPos.x, minerPos.y); ctx.lineTo(endX, endY); ctx.stroke();
    ctx.fillStyle = "#FFD93D"; ctx.beginPath(); ctx.arc(endX, endY, currentClawSize, 0, Math.PI * 2); ctx.fill();
}

function drawBoss() {
    ctx.fillStyle = "#8e44ad";
    ctx.beginPath(); ctx.arc(boss.x, boss.y, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "white"; ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`BOSS HP: ${boss.hp}`, boss.x, boss.y - 80);
    ctx.fillStyle = "#FFD93D";
    ctx.fillText(`WANTED: ${boss.targetElement}`, boss.x, boss.y + 100);

    projectiles.forEach((p, i) => {
        p.update(); p.draw();
        if (Math.hypot(p.x - boss.x, p.y - boss.y) < 60) {
            checkBossHit(p); projectiles.splice(i, 1);
        }
    });
}

function update() {
    if (gameState === 'waiting' || gameState === 'victory') return;
    
    if (score >= 2000 && !bossActive) bossActive = true;
    angle += angleDir;
    if (Math.abs(angle) > 1.3) angleDir *= -1;

    if (bossActive) {
        boss.x += boss.dir;
        if (boss.x > canvas.width - 100 || boss.x < 100) boss.dir *= -1;
    } else if (gameState === 'launching') {
        clawLength += launchSpeed;
        let ex = minerPos.x + Math.sin(angle) * clawLength;
        let ey = minerPos.y + Math.cos(angle) * clawLength;
        items.forEach((item, index) => {
            if (Math.hypot(ex - item.x, ey - item.y) < item.data.size) {
                caughtItem = item; items.splice(index, 1); gameState = 'returning'; 
                if(typeof playSound === "function") playSound('catch');
            }
        });
        if (clawLength > canvas.height - 50) gameState = 'returning';
    } else if (gameState === 'returning') {
        clawLength -= launchSpeed;
        if (clawLength <= 80) {
            if (caughtItem) startQuiz(caughtItem.data); else gameState = 'swinging';
            caughtItem = null;
        }
    }
}

function checkBossHit(p) {
    if (p.data.name.includes(boss.targetElement)) {
        boss.hp -= 20; shakeAmount = 20; score += 500; 
        if(typeof playSound === "function") playSound('bossHit');
        boss.targetElement = ["Gold", "Silver", "Water", "Salt"][Math.floor(Math.random()*4)];
        if (boss.hp <= 0) showVictoryScreen();
    } else { 
        score -= 100; 
        if(typeof playSound === "function") playSound('wrong'); 
    }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
}

function checkAnswer(isCorrect) {
    const comboEl = document.getElementById('combo-display');
    if (isCorrect) {
        if(typeof playSound === "function") playSound('correct'); 
        score += (100 * combo); combo++;
        comboEl.innerText = `🔥 COMBO X${combo}`; comboEl.style.display = 'block';
    } else {
        if(typeof playSound === "function") playSound('wrong'); 
        score -= 50; combo = 1; comboEl.style.display = 'none';
    }
    document.getElementById('score').innerText = `⭐ Points: ${score}`;
    quizOverlay.style.display = 'none';
    gameState = 'swinging';
    if (items.length < 4) initItems();
}

function startQuiz(data) {
    gameState = 'quiz'; quizOverlay.style.display = 'block';
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
            if (timeLeft <= 0) {
                document.getElementById('final-score-game-over').innerText = `Total Stars: ${score}`;
                document.getElementById('game-over-overlay').style.display = 'block';
                gameState = 'victory';
            }
        }
    }, 1000);
}

function showVictoryScreen() { 
    gameState = 'victory'; 
    document.getElementById('final-score-display').innerText = `Total Stars: ${score}`;
    document.getElementById('victory-overlay').style.display = 'block'; 
}

function toggleGlossary(s) { 
    const glossary = document.getElementById('glossary-overlay');
    if (glossary) glossary.style.display = s ? 'block' : 'none'; 
}

window.addEventListener('mousedown', () => { 
    if (gameState === 'waiting' || gameState === 'victory' || gameState === 'quiz') return;
    if (bossActive) {
        projectiles.push(new Projectile(minerPos.x, minerPos.y, angle, matterTypes[Math.floor(Math.random()*matterTypes.length)]));
        if(typeof playSound === "function") playSound('launch');
    } else if (gameState === 'swinging') { 
        gameState = 'launching'; 
        if(typeof playSound === "function") playSound('launch');
    } 
});

draw();