const sounds = {
    bgMusic: new Audio('./audio/background_theme.mp3'),
    catch: new Audio('./audio/catch.mp3'),
    correct: new Audio('./audio/correct.mp3'),
    wrong: new Audio('./audio/wrong.mp3'),
    powerup: new Audio('./audio/powerup.mp3'),
    launch: new Audio('./audio/launch.mp3'),
    bossHit: new Audio('./audio/boss_hit.mp3')
};

sounds.bgMusic.loop = true;
let isMuted = false;
let masterVolume = 0.5;

function playMusic() {
    sounds.bgMusic.volume = masterVolume * 0.3;
    sounds.bgMusic.play().catch(e => {});
}

function setVolume(val) {
    masterVolume = parseFloat(val);
    sounds.bgMusic.volume = masterVolume * 0.3;
}

function playSound(name) {
    if (isMuted || !sounds[name]) return;
    const s = sounds[name].cloneNode();
    s.volume = masterVolume;
    s.play().catch(e => {});
    setTimeout(() => { s.pause(); s.currentTime = 0; s.remove(); }, 1000);
}

function handleMuteToggle() {
    isMuted = !isMuted;
    sounds.bgMusic.muted = isMuted;
    const btn = document.getElementById('mute-btn');
    btn.innerText = isMuted ? "🔇" : "🔊";
}