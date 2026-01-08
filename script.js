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

// Game State Object
const state = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    lives: 3,
    level: 1,
    currentInput: '',
    asteroids: [],
    spawnRate: 2000, // ms
    lastSpawnTime: 0,
    difficulty: 'easy',
    ops: ['+'], // Default
    highScore: localStorage.getItem('spaceMathHighScore') || 0
};

// Difficulty Settings
const settings = {
    easy: { speed: 0.3, maxNum: 10 },   // Slower speed
    medium: { speed: 0.7, maxNum: 20 }, // Slower speed
    hard: { speed: 1.2, maxNum: 50 }    // Slower speed
};

// UI Elements
const ui = {
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    pauseScreen: document.getElementById('pause-screen'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    finalScore: document.getElementById('final-score'),
    lives: document.getElementById('lives'),
    input: document.getElementById('current-input'),
    difficultySelect: document.getElementById('difficulty'),
    pauseBtn: document.getElementById('pause-btn')
};

// Initialize High Score UI
ui.highScore.innerText = state.highScore;

// --- Math Logic ---

function generateProblem(difficulty) {
    const config = settings[difficulty];
    const operator = state.ops[Math.floor(Math.random() * state.ops.length)];
    let num1 = Math.floor(Math.random() * config.maxNum) + 1;
    let num2 = Math.floor(Math.random() * config.maxNum) + 1;
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
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
            answer = num1 * num2;
            text = `${num1} * ${num2}`;
            break;
        case '/':
            // Create a multiplication first, then reverse it for division
            num2 = Math.floor(Math.random() * 10) + 2; // Avoid divide by 1 or 0
            answer = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * answer;
            text = `${num1} ÷ ${num2}`;
            break;
    }

    return { text, answer };
}

// --- Game Loop Functions ---

class Asteroid {
    constructor(difficulty) {
        this.r = 15; // Radius (Smaller to look further away)
        const problem = generateProblem(difficulty);
        this.problemText = problem.text;
        this.answer = problem.answer;

        // Calculate text width to ensure it stays within bounds
        ctx.font = 'bold 16px Courier New';
        const textWidth = ctx.measureText(this.problemText).width;
        const halfWidth = textWidth / 2;
        const padding = 10;
        const minX = halfWidth + padding;
        const maxX = canvas.width - halfWidth - padding;

        this.x = Math.random() * (maxX - minX) + minX;
        this.y = -50;
        this.speed = settings[difficulty].speed + (Math.random() * 0.5); // Slight variance
        this.color = '#fff';
    }

    draw() {
        // Draw Math Problem
        ctx.fillStyle = '#00f3ff';
        ctx.font = 'bold 16px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.problemText, this.x, this.y);
    }

    update() {
        this.y += this.speed;
    }
}

function startGame() {
    state.difficulty = ui.difficultySelect.value;

    // Get selected operations
    const opCheckboxes = document.querySelectorAll('input[name="op"]');
    const selectedOps = [];
    opCheckboxes.forEach(cb => {
        if (cb.checked) selectedOps.push(cb.value);
    });

    // Default to addition if nothing selected
    state.ops = selectedOps.length > 0 ? selectedOps : ['+'];

    state.score = 0;
    state.lives = 3;
    state.currentInput = '';
    state.asteroids = [];
    state.isPlaying = true;
    state.isPaused = false;

    // Update UI
    ui.score.innerText = '0';
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

    // Spawn Asteroids
    if (timestamp - state.lastSpawnTime > state.spawnRate) {
        state.asteroids.push(new Asteroid(state.difficulty));
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
            state.lives--;
            ui.lives.innerText = state.lives;
            state.asteroids.splice(i, 1); // Remove asteroid

            // Visual feedback (screen flash red could go here)

            if (state.lives <= 0) {
                gameOver();
                return; // Stop loop
            }
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
    // Handle Negative sign (optional for hard mode, though we try to keep answers positive)
    else if (e.key === '-' && state.currentInput.length === 0) {
        state.currentInput += '-';
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
        state.asteroids.splice(hitIndex, 1);
        state.score += 10;
        ui.score.innerText = state.score;
        state.currentInput = ''; // Clear input on success
    } else {
        // MISS! (Optional: Penalty or just clear input)
        state.currentInput = '';
    }
    ui.input.innerText = state.currentInput;
}

// Button Listeners
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('game-over-menu-btn').addEventListener('click', returnToMenu);
document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('resume-btn').addEventListener('click', togglePause);
document.getElementById('menu-btn').addEventListener('click', returnToMenu);