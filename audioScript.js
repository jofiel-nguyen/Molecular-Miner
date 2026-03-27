const sounds = {
    bgMusic: new Audio('background_music.mp3'),
    catch: new Audio('catch.mp3'),
    correct: new Audio('correct.mp3'),
    wrong: new Audio('wrong.mp3'),
    powerup: new Audio('powerup.mp3'),
    launch: new Audio('launch.mp3'),
    bossHit: new Audio('boss_hit.mp3')
};

const sfxSettings = {
    catch:   { start: 2.0,  duration: 1.0 },
    correct: { start: 5.0,  duration: 1.5 },
    wrong:   { start: 10.0, duration: 1.2 },
    powerup: { start: 15.0, duration: 2.0 },
    launch:  { start: 1.0,  duration: 0.8 },
    bossHit: { start: 20.0, duration: 1.5 }
};

let isMuted = false;
let masterVolume = 0.5;

sounds.bgMusic.loop = true;

function playMusic() {
    sounds.bgMusic.volume = masterVolume * 0.4;
    sounds.bgMusic.play().catch(e => {});
}

function playSound(name) {
    if (isMuted || !sounds[name]) return;

    const config = sfxSettings[name];
    const s = sounds[name].cloneNode();
    
    s.volume = masterVolume;
    
    if (config) {
        s.currentTime = config.start;
        s.play().catch(e => {});
        
        setTimeout(() => {
            s.pause();
            s.remove();
        }, config.duration * 1000);
    } else {
        s.play().catch(e => {});
    }
}

function toggleMute() {
    isMuted = !isMuted;
    sounds.bgMusic.muted = isMuted;
    return isMuted;
}

function setVolume(val) {
    masterVolume = val;
    sounds.bgMusic.volume = val * 0.4;
}

function stopSound(name) {
    if (sounds[name]) {
        sounds[name].pause();
        sounds[name].currentTime = 0;
    }
}
