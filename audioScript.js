const sounds = {
    bgMusic: new Audio('background_music.mp3'),
    catch: new Audio('catch_sound.mp3'),
    correct: new Audio('correct_sound.mp3'),
    wrong: new Audio('wrong_sound.mp3'),
    powerup: new Audio('powerup_sound.mp3'),
    launch: new Audio('launch_sound.mp3')
};

// Set properties
sounds.bgMusic.loop = true;
sounds.bgMusic.volume = 0.4;

function playSound(name) {
    if (sounds[name]) {
        // Reset sound to start in case it's already playing
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {
            // Browsers block auto-play until user clicks
            console.log("Audio waiting for user interaction...");
        });
    }
}

function stopSound(name) {
    if (sounds[name]) {
        sounds[name].pause();
        sounds[name].currentTime = 0;
    }
}
