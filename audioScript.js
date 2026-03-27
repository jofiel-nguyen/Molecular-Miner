// --- Audio Configuration ---
const audioFiles = {
    // If you have separate files, put their names here. 
    // If you are using ONE file for all SFX, use the same name for each.
    bgMusic: new Audio('background_theme.mp3'),
    sfxLibrary: new Audio('game_sounds.mp3') // Your 3-min file containing SFX
};

// Define where each sound starts and how long it lasts (in seconds)
const sfxMap = {
    catch:   { start: 5.0,  duration: 1.2 },
    correct: { start: 15.4, duration: 1.5 },
    wrong:   { start: 25.0, duration: 2.0 },
    powerup: { start: 40.2, duration: 2.5 },
    launch:  { start: 55.0, duration: 0.8 },
    bossHit: { start: 70.0, duration: 1.5 }
};

// --- Settings ---
audioFiles.bgMusic.loop = true;
let isMuted = false;
let masterVolume = 0.5;

/**
 * Main function to play music
 */
function playMusic() {
    audioFiles.bgMusic.volume = masterVolume * 0.6; // Music usually quieter than SFX
    audioFiles.bgMusic.play().catch(e => console.log("Autoplay blocked: Click to start music"));
}

/**
 * Plays a specific snippet from the long SFX file
 * @param {string} action - The name of the sound in sfxMap
 */
function playSound(action) {
    if (isMuted) return;

    const config = sfxMap[action];
    if (!config) {
        // Fallback for sounds that might be separate files (like bgMusic)
        if (audioFiles[action]) {
            audioFiles[action].currentTime = 0;
            audioFiles[action].play();
        }
        return;
    }

    // Create a clone to allow overlapping sounds (e.g., catching 2 items fast)
    const soundClip = audioFiles.sfxLibrary.cloneNode();
    soundClip.volume = masterVolume;
    soundClip.currentTime = config.start;
    
    soundClip.play();

    // Stop the clip after the duration expires
    setTimeout(() => {
        soundClip.pause();
        soundClip.remove(); // Clean up memory
    }, config.duration * 1000);
}

/**
 * Toggle Mute
 */
function toggleMute() {
    isMuted = !isMuted;
    audioFiles.bgMusic.muted = isMuted;
    return isMuted;
}

/**
 * Change Volume (0.0 to 1.0)
 */
function setVolume(val) {
    masterVolume = val;
    audioFiles.bgMusic.volume = val * 0.6;
}

// Initialized via User Interaction in logicScript.js (startGame)
