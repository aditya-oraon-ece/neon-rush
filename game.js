const canvas = document.querySelector(".arena__canvas");
const context = canvas.getContext("2d");
const gameShell = document.querySelector(".game-shell");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const pauseLabel = document.querySelector("#pause-label");
const startScreen = document.querySelector("#start-screen");
const pauseScreen = document.querySelector("#pause-screen");
const playingMessage = document.querySelector("#playing-message");
const scoreDisplay = document.querySelector("#score");

const game = {
  phase: "ready",
  width: 0,
  height: 0,
  lastFrameTime: 0,
  particles: [],
};

const colors = {
  cyan: "61, 244, 255",
  pink: "255, 70, 200",
};

if (!context) {
  throw new Error("NEON RUSH needs a browser with Canvas 2D support.");
}

function createParticles() {
  const particleCount = Math.max(32, Math.min(110, Math.round((game.width * game.height) / 11000)));

  game.particles = Array.from({ length: particleCount }, () => ({
    x: Math.random() * game.width,
    y: Math.random() * game.height,
    radius: 0.6 + Math.random() * 1.6,
    speed: 8 + Math.random() * 20,
    drift: (Math.random() - 0.5) * 8,
    phase: Math.random() * Math.PI * 2,
    tint: Math.random() > 0.78 ? colors.pink : colors.cyan,
  }));
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  game.width = bounds.width;
  game.height = bounds.height;
  canvas.width = Math.round(game.width * pixelRatio);
  canvas.height = Math.round(game.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
}

function updateParticles(deltaSeconds) {
  game.particles.forEach((particle) => {
    particle.y -= particle.speed * deltaSeconds;
    particle.x += Math.sin(particle.phase) * particle.drift * deltaSeconds;
    particle.phase += deltaSeconds * 0.8;

    if (particle.y < -particle.radius) {
      particle.y = game.height + particle.radius;
      particle.x = Math.random() * game.width;
    }

    if (particle.x < -particle.radius) {
      particle.x = game.width + particle.radius;
    } else if (particle.x > game.width + particle.radius) {
      particle.x = -particle.radius;
    }
  });
}

function drawGrid() {
  const gridSize = 64;

  context.beginPath();
  context.strokeStyle = "rgba(135, 150, 210, 0.055)";
  context.lineWidth = 1;

  for (let x = gridSize; x < game.width; x += gridSize) {
    context.moveTo(x, 0);
    context.lineTo(x, game.height);
  }

  for (let y = gridSize; y < game.height; y += gridSize) {
    context.moveTo(0, y);
    context.lineTo(game.width, y);
  }

  context.stroke();
}

function drawParticles(timestamp) {
  game.particles.forEach((particle) => {
    const shimmer = 0.38 + Math.sin(timestamp * 0.0015 + particle.phase) * 0.22;

    context.beginPath();
    context.fillStyle = `rgba(${particle.tint}, ${shimmer})`;
    context.shadowBlur = particle.radius * 5;
    context.shadowColor = `rgba(${particle.tint}, 0.55)`;
    context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    context.fill();
  });

  context.shadowBlur = 0;
}

function drawBackground(timestamp) {
  const background = context.createRadialGradient(
    game.width * 0.5,
    game.height * 0.46,
    0,
    game.width * 0.5,
    game.height * 0.46,
    Math.max(game.width, game.height) * 0.75,
  );

  background.addColorStop(0, "#11132b");
  background.addColorStop(0.55, "#0a0b19");
  background.addColorStop(1, "#070811");
  context.fillStyle = background;
  context.fillRect(0, 0, game.width, game.height);
  drawGrid();
  drawParticles(timestamp);
}

function updateInterface() {
  const isReady = game.phase === "ready";
  const isPlaying = game.phase === "playing";
  const isPaused = game.phase === "paused";

  gameShell.dataset.phase = game.phase;
  startScreen.hidden = !isReady;
  pauseScreen.hidden = !isPaused;
  playingMessage.hidden = !isPlaying;
  pauseButton.hidden = isReady;
  pauseLabel.textContent = isPaused ? "RESUME" : "PAUSE";
  pauseButton.setAttribute("aria-label", isPaused ? "Resume game" : "Pause game");
  scoreDisplay.textContent = "000000";
}

function startGame() {
  if (game.phase !== "ready") {
    return;
  }

  game.phase = "playing";
  updateInterface();
}

function togglePause() {
  if (game.phase === "playing") {
    game.phase = "paused";
  } else if (game.phase === "paused") {
    game.phase = "playing";
  } else {
    return;
  }

  updateInterface();
}

function handleKeydown(event) {
  if (event.repeat) {
    return;
  }

  if (game.phase === "ready" && event.key === "Enter") {
    startGame();
    return;
  }

  if (game.phase === "playing" || game.phase === "paused") {
    if (event.code === "Space" || event.key.toLowerCase() === "p") {
      event.preventDefault();
      togglePause();
    }
  }
}

function gameLoop(timestamp) {
  const deltaSeconds = Math.min((timestamp - game.lastFrameTime) / 1000 || 0, 0.05);
  game.lastFrameTime = timestamp;

  if (game.phase !== "paused") {
    updateParticles(deltaSeconds);
  }

  drawBackground(timestamp);
  window.requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateInterface();
window.requestAnimationFrame(gameLoop);