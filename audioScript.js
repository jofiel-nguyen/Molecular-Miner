const audioFiles = {
    bgMusic: new Audio('background_theme.mp3'),
    sfxLibrary: new Audio('game_sounds.mp3')
};

const sfxMap = {
    catch:   { start: 5.0,  duration: 1.2 },
    correct: { start: 15.4, duration: 1.5 },
    wrong:   { start: 25.0, duration: 2.0 },
    powerup: { start: 40.2, duration: 2.5 },
    launch:  { start: 55.0, duration: 0.8 },
    bossHit: { start: 70.0, duration: 1.5 }
};

let isMuted = false;
let masterVolume = 0.5;

audioFiles.bgMusic.loop = true;

function playMusic() {
    audioFiles.bgMusic.volume = masterVolume * 0.6;
    audioFiles.bgMusic.play().catch(e => {});
}

function playSound(action) {
    if (isMuted) return;

    const config = sfxMap[action];
    if (!config) {
        if (audioFiles[action]) {
            audioFiles[action].currentTime = 0;
            audioFiles[action].play();
        }
        return;
    }

    const soundClip = audioFiles.sfxLibrary.cloneNode();
    soundClip.volume = masterVolume;
    soundClip.currentTime = config.start;
    soundClip.play();

    setTimeout(() => {
        soundClip.pause();
        soundClip.remove();
    }, config.duration * 1000);
}

function toggleMute() {
    isMuted = !isMuted;
    audioFiles.bgMusic.muted = isMuted;
    return isMuted;
}

function setVolume(val) {
    masterVolume = val;
    audioFiles.bgMusic.volume = val * 0.6;
}
