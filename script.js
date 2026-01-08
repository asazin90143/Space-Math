/**
 * SPACE MATH - Game Logic
 * Handles canvas rendering, game state, and math generation.
 */

// --- Configuration ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize Canvas to Full Screen
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Audio Context (Synthesized Sound)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Game State Object
const state = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    streak: 0,
    lives: 3,
    level: 1,
    currentInput: '',
    asteroids: [],
    particles: [],
    spawnRate: 2000, // ms
    lastSpawnTime: 0,
    difficulty: 'easy',
    ops: ['+'], // Default
    isMuted: false,
    nextBossScore: 200,
    frozenUntil: 0,
    shieldedUntil: 0,
    slowMoUntil: 0,
    doublePointsUntil: 0,
    highScore: localStorage.getItem('spaceMathHighScore') || 0
};

// Difficulty Settings
const settings = {
    easy: { speed: 0.2, maxNum: 10 },   // Slower speed
    medium: { speed: 0.4, maxNum: 20 }, // Slower speed
    hard: { speed: 0.8, maxNum: 30 },    // Slower speed
    expert: { speed: 1, maxNum: 50 }    // Slower speed
};

// Power-Up Configuration
const powerUpTypes = [
    { type: 'explosion', color: '#FFA500', chance: 0.05 }, // Orange: Destroys all
    { type: 'freeze', color: '#4488FF', chance: 0.10 },    // Blue: Stops time
    { type: 'shield', color: '#FFD700', chance: 0.10 },    // Gold: Protects bottom
    { type: 'life', color: '#00FF00', chance: 0.05 },      // Green: +1 Life
    { type: 'slowMo', color: '#A020F0', chance: 0.10 },    // Purple: Slows time
    { type: 'doublePoints', color: '#FF00FF', chance: 0.05 } // Pink: 2x Points
];

// UI Elements
const ui = {
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    streak: document.getElementById('streak'),
    lives: document.getElementById('lives'),
    input: document.getElementById('current-input'),
    difficultySelect: document.getElementById('difficulty'),
    pauseBtn: document.getElementById('pause-btn'),
    muteBtn: document.getElementById('mute-btn'),
    levelUpMsg: document.getElementById('level-up-msg')
};

// Initialize High Score UI
ui.highScore.innerText = state.highScore;

// --- Math Logic ---

function generateProblem(difficulty, isBoss = false) {
    const config = settings[difficulty];
    const operator = state.ops[Math.floor(Math.random() * state.ops.length)];
    const max = isBoss ? config.maxNum * 2 + 10 : config.maxNum; // Harder for boss
    let num1 = Math.floor(Math.random() * max) + 1;
    let num2 = Math.floor(Math.random() * max) + 1;
    let answer = 0;
    let text = '';

    // Ensure clean numbers (no negatives, integer division)
    switch (operator) {
        case '+':
            answer = num1 + num2;
            text = `${num1} + ${num2}`;
            break;
        case '-':
            if (num1 < num2) [num1, num2] = [num2, num1]; // Swap to ensure positive
            answer = num1 - num2;
            text = `${num1} - ${num2}`;
            break;
        case '*':
            // Reduce maxNum for multiplication to keep it type-able
            const mMax = isBoss ? 20 : 12;
            num1 = Math.floor(Math.random() * mMax) + 1;
            num2 = Math.floor(Math.random() * mMax) + 1;
            answer = num1 * num2;
            text = `${num1} * ${num2}`;
            break;
        case '/':
            // Create a multiplication first, then reverse it for division
            const dMax = isBoss ? 20 : 10;
            num2 = Math.floor(Math.random() * dMax) + 2; // Avoid divide by 1 or 0
            answer = Math.floor(Math.random() * dMax) + 1;
            num1 = num2 * answer;
            text = `${num1} ÷ ${num2}`;
            break;
    }

    return { text, answer };
}

// --- Audio Logic ---
function playLaserSound() {
    if (state.isMuted) return;

    // Create oscillator for retro pew-pew sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // Start high
    osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.15); // Drop fast

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playExplosionSound() {
    if (state.isMuted) return;

    // Create oscillator for explosion/impact sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'square'; // Grittier sound than sawtooth
    osc.frequency.setValueAtTime(100, audioCtx.currentTime); // Start low
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3); // Drop lower

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// --- Game Loop Functions ---

// --- Particle System ---
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        // Random velocity in all directions
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0; // Opacity (starts at 100%)
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02; // Fade out speed
    }

    draw() {
        ctx.globalAlpha = this.life; // Set transparency
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); // Tiny circle
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset transparency for other objects
    }
}

class Asteroid {
    constructor(difficulty, isBoss = false) {
        this.isBoss = isBoss;
        this.r = isBoss ? 50 : 15; // Giant radius for boss
        const problem = generateProblem(difficulty, isBoss);
        this.problemText = problem.text;
        this.answer = problem.answer;

        // Calculate text width to ensure it stays within bounds
        ctx.font = isBoss ? 'bold 24px Courier New' : 'bold 16px Courier New';
        const textWidth = ctx.measureText(this.problemText).width;
        const halfWidth = textWidth / 2;
        const padding = 10;
        const minX = halfWidth + padding;
        const maxX = canvas.width - halfWidth - padding;

        this.x = Math.random() * (maxX - minX) + minX;
        this.y = -50;
        this.speed = isBoss ? 0.3 : settings[difficulty].speed + (Math.random() * 0.5); // Boss is slower

        // Determine Power-Up
        this.powerUp = null;
        if (!isBoss) {
            const rand = Math.random();
            let cumulative = 0;
            for (const p of powerUpTypes) {
                cumulative += p.chance;
                if (rand < cumulative) {
                    this.powerUp = p.type;
                    this.color = p.color;
                    break;
                }
            }
        }

        // Set Default Colors if no power-up
        if (this.isBoss) {
            this.color = '#ff0055';
        } else if (!this.powerUp) {
            this.color = '#00f3ff'; // Standard Neon Blue
        }
    }

    draw() {
        if (this.isBoss) {
            // Draw Boss Body
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = '#2a0015';
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw Math Problem
        ctx.fillStyle = this.color;
        ctx.font = this.isBoss ? 'bold 24px Courier New' : 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.problemText, this.x, this.y);
    }

    update() {
        if (performance.now() < state.frozenUntil) return; // Freeze effect

        let moveSpeed = this.speed;
        if (performance.now() < state.slowMoUntil) {
            moveSpeed *= 0.25; // Slow down to 25% speed
        }

        this.y += moveSpeed;
    }
}

function startGame() {
    state.difficulty = ui.difficultySelect.value;

    // Resume Audio Context (Browser requirement)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Get selected operations
    const opCheckboxes = document.querySelectorAll('input[name="op"]');
    const selectedOps = [];
    opCheckboxes.forEach(cb => {
        if (cb.checked) selectedOps.push(cb.value);
    });

    // Default to addition if nothing selected
    state.ops = selectedOps.length > 0 ? selectedOps : ['+'];

    state.score = 0;
    state.streak = 0;
    state.lives = 3;
    state.nextBossScore = 200;
    state.currentInput = '';
    state.frozenUntil = 0;
    state.shieldedUntil = 0;
    state.slowMoUntil = 0;
    state.doublePointsUntil = 0;
    state.asteroids = [];
    state.particles = [];
    state.isPlaying = true;
    state.isPaused = false;

    // Update UI
    ui.score.innerText = '0';
    ui.streak.innerText = '0';
    ui.lives.innerText = '3';
    ui.input.innerText = '';
    ui.startScreen.classList.remove('active');
    ui.gameOverScreen.classList.remove('active');
    ui.pauseScreen.classList.remove('active');
    ui.pauseBtn.style.display = 'block';

    // Start Loop
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    state.isPlaying = false;

    // Save High Score
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('spaceMathHighScore', state.highScore);
        ui.highScore.innerText = state.highScore;
    }

    ui.finalScore.innerText = state.score;
    ui.gameOverScreen.classList.add('active');
    ui.pauseBtn.style.display = 'none';
}

function togglePause() {
    if (!state.isPlaying) return;
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        ui.pauseScreen.classList.add('active');
    } else {
        ui.pauseScreen.classList.remove('active');
    }
}

function toggleMute() {
    state.isMuted = !state.isMuted;
    ui.muteBtn.innerText = state.isMuted ? "UNMUTE SOUND" : "MUTE SOUND";
}

function returnToMenu() {
    state.isPlaying = false;
    state.isPaused = false;
    ui.pauseScreen.classList.remove('active');
    ui.gameOverScreen.classList.remove('active');
    ui.startScreen.classList.add('active');
    ui.pauseBtn.style.display = 'none';
}

function gameLoop(timestamp) {
    if (!state.isPlaying) return;
    if (state.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Active Effects
    const now = performance.now();

    // Draw Power-Up Timers
    let barY = 60;
    const drawTimer = (label, color, until, maxDuration) => {
        const remaining = until - now;
        if (remaining > 0) {
            const barW = 150;
            const barH = 15;
            const x = 10;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, barY, barW, barH);

            // Fill
            const pct = Math.min(1, Math.max(0, remaining / maxDuration));
            ctx.fillStyle = color;
            ctx.fillRect(x, barY, barW * pct, barH);

            // Border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, barY, barW, barH);

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Courier New';
            ctx.textAlign = 'left';
            ctx.fillText(label, x + 5, barY + 11);

            barY += 25;
        }
    };

    drawTimer("SHIELD", "#FFD700", state.shieldedUntil, 10000);
    drawTimer("FREEZE", "#4488FF", state.frozenUntil, 5000);
    drawTimer("SLOW MO", "#A020F0", state.slowMoUntil, 5000);
    drawTimer("2X POINTS", "#FF00FF", state.doublePointsUntil, 10000);

    // Shield Bottom Overlay
    if (now < state.shieldedUntil) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    }

    // Spawn Asteroids
    if (timestamp - state.lastSpawnTime > state.spawnRate) {
        // Check for Boss Spawn
        if (state.score >= state.nextBossScore) {
            state.asteroids.push(new Asteroid(state.difficulty, true));
            state.nextBossScore += 200;
        } else {
            state.asteroids.push(new Asteroid(state.difficulty));
        }
        state.lastSpawnTime = timestamp;

        // Increase difficulty slightly over time (speed up spawn rate)
        if (state.spawnRate > 500) state.spawnRate -= 10;
    }

    // Update & Draw Asteroids
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const asteroid = state.asteroids[i];
        asteroid.update();
        asteroid.draw();

        // Check if hit bottom
        if (asteroid.y - asteroid.r > canvas.height) {
            // Shield Protection
            if (performance.now() < state.shieldedUntil) {
                state.asteroids.splice(i, 1);
                continue;
            }

            state.lives--;
            state.streak = 0;
            ui.streak.innerText = 0;
            ui.lives.innerText = state.lives;
            state.asteroids.splice(i, 1); // Remove asteroid

            // Visual feedback (screen flash red could go here)
            playExplosionSound();

            if (state.lives <= 0) {
                gameOver();
                return; // Stop loop
            }
        }
    }

    // --- Update & Draw Particles ---
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        p.draw();

        // Remove dead particles
        if (p.life <= 0) {
            state.particles.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// --- Input Handling ---

window.addEventListener('keydown', (e) => {
    if (!state.isPlaying) return;
    if (state.isPaused) return;

    // Handle Numbers
    if (e.key >= '0' && e.key <= '9') {
        state.currentInput += e.key;
    }
    // Handle Backspace
    else if (e.key === 'Backspace') {
        state.currentInput = state.currentInput.slice(0, -1);
    }
    // Handle Enter (Submit)
    else if (e.key === 'Enter') {
        checkAnswer();
    }
    // Handle Escape (Pause)
    else if (e.key === 'Escape') {
        togglePause();
    }

    // Update UI
    ui.input.innerText = state.currentInput;
});

function activatePowerUp(type) {
    const now = performance.now();

    switch (type) {
        case 'explosion':
            // Destroy all non-boss asteroids
            for (let i = state.asteroids.length - 1; i >= 0; i--) {
                if (!state.asteroids[i].isBoss) {
                    // Create particles for them
                    const a = state.asteroids[i];
                    for (let j = 0; j < 10; j++) {
                        state.particles.push(new Particle(a.x, a.y, '#FFA500'));
                    }
                    state.asteroids.splice(i, 1);
                    state.score += 5;
                }
            }
            ui.score.innerText = state.score;
            playExplosionSound();
            break;

        case 'freeze':
            state.frozenUntil = now + 5000; // 5 Seconds
            break;

        case 'shield':
            state.shieldedUntil = now + 10000; // 10 Seconds
            break;

        case 'slowMo':
            state.slowMoUntil = now + 5000; // 5 Seconds
            break;

        case 'doublePoints':
            state.doublePointsUntil = now + 10000; // 10 Seconds
            break;

        case 'life':
            state.lives++;
            ui.lives.innerText = state.lives;
            break;
    }
}

function checkAnswer() {
    const value = parseInt(state.currentInput);
    if (isNaN(value)) return;

    let hitIndex = -1;
    let maxY = -1;

    // Find the lowest asteroid that matches the answer
    state.asteroids.forEach((asteroid, index) => {
        if (asteroid.answer === value) {
            // Prioritize the one closest to bottom (highest Y)
            if (asteroid.y > maxY) {
                maxY = asteroid.y;
                hitIndex = index;
            }
        }
    });

    if (hitIndex !== -1) {
        // HIT!
        // Spawn particles at the asteroid's position
        const hitAsteroid = state.asteroids[hitIndex];
        const pCount = hitAsteroid.isBoss ? 50 : 15;
        const pColor = hitAsteroid.color;
        for (let i = 0; i < pCount; i++) {
            state.particles.push(new Particle(hitAsteroid.x, hitAsteroid.y, pColor));
        }
        playLaserSound();

        // Activate Power-Up if present
        if (hitAsteroid.powerUp) {
            activatePowerUp(hitAsteroid.powerUp);
        }

        state.asteroids.splice(hitIndex, 1);

        let points = hitAsteroid.isBoss ? 50 : 10;
        if (performance.now() < state.doublePointsUntil) points *= 2;

        state.score += points; // Bonus points for boss
        ui.score.innerText = state.score;

        // Update Streak
        state.streak++;
        ui.streak.innerText = state.streak;

        // Level Up Notification every 50 points
        if (state.score > 0 && state.score % 100 === 0) {
            showLevelUp();
        }

        state.currentInput = ''; // Clear input on success
    } else {
        // MISS! (Optional: Penalty or just clear input)
        state.streak = 0;
        ui.streak.innerText = 0;
        state.currentInput = '';
    }
    ui.input.innerText = state.currentInput;
}

function showLevelUp() {
    // Reset animation
    ui.levelUpMsg.classList.remove('active');
    void ui.levelUpMsg.offsetWidth; // Trigger reflow to restart animation
    ui.levelUpMsg.classList.add('active');
}

// Button Listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('game-over-menu-btn').addEventListener('click', returnToMenu);
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('menu-btn').addEventListener('click', returnToMenu);
document.getElementById('mute-btn').addEventListener('click', toggleMute);