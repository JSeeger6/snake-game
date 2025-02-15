// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid settings
const cellSize = 20;
const cols = canvas.width / cellSize;
const rows = canvas.height / cellSize;
// Define a gap between snake squares
const gap = 2;

// Pulse effect settings
let pulseStart = 0; // time (ms) when pulse started (0 if inactive)
const delayBetweenSegments = 50; // delay in ms for pulse to travel between segments
const pulseDuration = 300; // duration of pulse effect per segment in ms
const pulseAmplitude = 0.3; // additional scale factor at the peak of the pulse

// Game variables
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = {};
let score = 0;
let highScore = 0;
let foodCounter = 0;
let gameInterval;
let isPaused = false;
let gameOver = false;
// Global variable to store leaderboard data
let leaderboardData = [];

// Cookie functions to store/retrieve high score
function setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}
function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let c of ca) {
    c = c.trim();
    if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
    }
    }
    return "";
}

// Initialize or reset the game
function init() {
    snake = [];
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);
    // Create initial snake with 5 segments
    for (let i = 4; i >= 0; i--) {
        snake.push({ x: startX - i, y: startY });
    }
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    foodCounter = 0;
    updateScore();
    placeFood();
    gameOver = false;
    isPaused = false;
    pulseStart = 0;
    hideOverlay('gameOverOverlay');
    hideOverlay('pauseOverlay');
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, 100);
}

// Main game loop
function gameLoop() {
    if (isPaused || gameOver) return;
    
    // Update snake's direction based on last key press
    direction = nextDirection;
    const head = {
    x: snake[snake.length - 1].x + direction.x,
    y: snake[snake.length - 1].y + direction.y
    };
    
    // Check wall collisions
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        endGame();
        return;
    }
    // Check self-collision
    for (let segment of snake) {
        if (segment.x === head.x && segment.y === head.y) {
            endGame();
            return;
        }
    }
    
    snake.push(head);
    
    // Check food consumption
    if (head.x === food.x && head.y === food.y) {
        foodCounter++;
        score += foodCounter;
        updateScore();
        placeFood();
    // Start the pulse effect from the head (which is the last element)
        pulseStart = performance.now();
    } else {
        snake.shift(); // move snake forward
    }
    
    draw();
}

// Draw snake and food on canvas
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food as a circle
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2.5,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Get current time for pulse effect calculations
    const now = performance.now();
    
    // Draw snake with a gap and reversed pulse effect
    ctx.fillStyle = 'lime';
    snake.forEach((segment, index) => {
    // Calculate reversed index so that head (last segment) gets 0 delay
    const reversedIndex = snake.length - 1 - index;
    let scale = 1;
    if (pulseStart) {
        const dt = now - pulseStart - (reversedIndex * delayBetweenSegments);
        if (dt >= 0 && dt < pulseDuration) {
        scale = 1 + pulseAmplitude * Math.sin(Math.PI * dt / pulseDuration);
        }
    }
    const base = cellSize - gap * 2;
    const newWidth = base * scale;
    const newHeight = base * scale;
    const offset = (newWidth - base) / 2;
    ctx.fillRect(
        segment.x * cellSize + gap - offset,
        segment.y * cellSize + gap - offset,
        newWidth,
        newHeight
    );
    });
    
    // Clear the pulse effect once it's done propagating down the snake
    if (pulseStart && now - pulseStart > (snake.length * delayBetweenSegments + pulseDuration)) {
    pulseStart = 0;
    }
}

// Place food at a random valid position (avoid snake)
function placeFood() {
    let valid = false;
    while (!valid) {
    food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
    };
    valid = true;
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
        valid = false;
        break;
        }
    }
    }
}

function skipScoreSubmission() {
    hideOverlay('submitScoreOverlay')
    showOverlay('startOverlay')
}

// Update score displays
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('pauseScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
}

// End the game and show game over overlay
function endGame() {
    gameOver = true;
    clearInterval(gameInterval);
    if (score > highScore) {
    highScore = score;
    setCookie('highScore', highScore, 365);
    }
    updateScore();
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverHighScore').textContent = highScore;
    showOverlay('gameOverOverlay');
}

// Pause the game and show pause overlay
function pauseGame() {
    if (gameOver) return;
    isPaused = true;
    clearInterval(gameInterval);
    updateScore();
    showOverlay('pauseOverlay');
}

// Resume the game from paused state
function resumeGame() {
    isPaused = false;
    hideOverlay('pauseOverlay');
    gameInterval = setInterval(gameLoop, 100);
}

// Reset the game entirely
function resetGame() {
    init();
}

// Start the game from the initial overlay
function startGame() {
    hideOverlay('startOverlay');
    init();
}

// Utility functions to show/hide overlays
function showOverlay(id) {
    document.getElementById(id).style.display = 'flex';
}
function hideOverlay(id) {
    document.getElementById(id).style.display = 'none';
}

function formatDate(createdAt) {
    // 'createdAt' is assumed to be a Unix timestamp in milliseconds
    const date = new Date(createdAt);
    const now = new Date();
  
    // Check if the date is "today" by comparing year, month, and day
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    ) {
      return 'today';
    }
  
    // Calculate the difference in days (ignoring time, comparing only the date portion)
    const msPerDay = 24 * 60 * 60 * 1000;
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowOnly - dateOnly) / msPerDay);
  
    return diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
  }

// Update the leaderboard table with API data
function updateLeaderboard(data) {
    leaderboardData = data; // Save the latest leaderboard data for later use
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = ''; // Clear previous entries
    data.forEach((entry, index) => {
        const row = document.createElement('tr');

        const rankCell = document.createElement('td');
        rankCell.textContent = "#" + (index + 1);
        row.appendChild(rankCell);
        
        const nameCell = document.createElement('td');
        nameCell.textContent = entry.name;
        row.appendChild(nameCell);
        
        const scoreCell = document.createElement('td');
        scoreCell.textContent = entry.score;
        row.appendChild(scoreCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDate(entry.created_at);
        row.appendChild(dateCell);
        
        tbody.appendChild(row);
    });
}

async function fetchScores() {
    const url = 'https://x8ki-letl-twmt.n7.xano.io/api:t-PNuqnR/leaderboard';
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
      const result = await response.json();
      //console.log('Leaderboard response:', result);
  
      if (Array.isArray(result)) {
        updateLeaderboard(result);
      } else {
        console.error('Unexpected response structure', result);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
}

// Post a new score to the API and then update the leaderboard
async function postScore(name, score) {
    const url = 'https://x8ki-letl-twmt.n7.xano.io/api:t-PNuqnR/leaderboard';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, score }),
      });
  
      // If the response status is not in the 200–299 range, treat it as an error.
      if (!response.ok) {
        const errorText = await response.text();
        console.error('POST failed:', errorText);
        return;
      }
  
      // Otherwise, parse the JSON response
      const result = await response.json();
      console.log('POST response:', result);
  
      // If you want, you can check the structure of 'result' here
      // For example, if Xano returns the created object with an "id" field, you might do:
      // if (result.id) { ... } else { ... }
  
      // For now, assume it's successful if the request was OK
      console.log('Score posted successfully!');
      // Refetch scores to update the leaderboard immediately
      fetchScores();
  
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  function maybeShowSubmitScoreOverlay() {
    let qualifies = false;
    // If there are fewer than 10 entries, the player qualifies automatically
    if (leaderboardData.length < 10) {
        qualifies = true;
    } else {
        // Check if the current score is greater than the 10th entry (index 9)
        if (score > leaderboardData[9].score) {
            qualifies = true;
            console.log("USER QUALIFIES!")
        }
    }
    if (qualifies) {
        // Update the submit overlay to display the score
        document.getElementById('submitScoreDisplay').textContent = score;
        showOverlay('submitScoreOverlay');
    } else {
        showOverlay('gameOverOverlay');
    }
}

// Modified endGame function: Call our new function to check for leaderboard submission
function endGame() {
    gameOver = true;
    clearInterval(gameInterval);
    if (score > highScore) {
        highScore = score;
        setCookie('highScore', highScore, 365);
    }
    updateScore();
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverHighScore').textContent = highScore;
    
    // Instead of directly showing the game over overlay, check for leaderboard qualification.
    maybeShowSubmitScoreOverlay();
}

// New function: Called when the user submits their name in the submit overlay
function submitScoreFromOverlay() {
    const name = document.getElementById('playerNameInput').value;
    if (name.trim() === '') {
        alert("Please enter your name");
        return;
    }
    hideOverlay('submitScoreOverlay');
    postScore(name, score);
    showOverlay('startOverlay')
}

// Listen for key presses: arrow keys for movement, space for pause/resume
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    if (e.key === 'ArrowUp' && direction.y !== 1) {
    nextDirection = { x: 0, y: -1 };
    } else if (e.key === 'ArrowDown' && direction.y !== -1) {
    nextDirection = { x: 0, y: 1 };
    } else if (e.key === 'ArrowLeft' && direction.x !== 1) {
    nextDirection = { x: -1, y: 0 };
    } else if (e.key === 'ArrowRight' && direction.x !== -1) {
    nextDirection = { x: 1, y: 0 };
    } else if (e.key === ' ') {
    if (!isPaused) {
        pauseGame();
    } else {
        resumeGame();
    }
    }
});

// On window load, retrieve stored high score and update scoreboard.
// Do not start the game automatically; wait for the user to click "Start".
window.onload = function() {
    highScore = getCookie('highScore') ? parseInt(getCookie('highScore')) : 0;
    updateScore();
    fetchScores();
    // Set an interval to refresh leaderboard data every 5 minutes (300,000 ms)
    setInterval(fetchScores, 300000);
    // postScore("Jacob7", 300)
    // Start overlay remains visible until the user clicks "Start"
};