const canvas = document.querySelector(".arena__canvas");
const context = canvas.getContext("2d");
const gameShell = document.querySelector(".game-shell");
const startButton = document.querySelector("#start-button");
const pauseButton = document.querySelector("#pause-button");
const pauseLabel = document.querySelector("#pause-label");
const restartButton = document.querySelector("#restart-button");
const returnButton = document.querySelector("#return-button");
const startScreen = document.querySelector("#start-screen");
const pauseScreen = document.querySelector("#pause-screen");
const gameoverScreen = document.querySelector("#gameover-screen");
const playingMessage = document.querySelector("#playing-message");
const scoreDisplay = document.querySelector("#score");
const timeDisplay = document.querySelector("#time-display");
const finalScoreDisplay = document.querySelector("#final-score");

const GAME_DURATION_SECONDS = 60;
const MAX_TARGETS = 5;
const GREEN_TARGET_CHANCE = 0.72;
const colors = {
  cyan: "61, 244, 255",
  pink: "255, 70, 200",
  green: "#58ff9b",
  red: "#ff537c",
};

const game = {
  phase: "ready",
  width: 0,
  height: 0,
  lastFrameTime: 0,
  elapsedSeconds: 0,
  timeLeft: GAME_DURATION_SECONDS,
  score: 0,
  finalScore: 0,
  spawnTimer: 0,
  particles: [],
  targets: [],
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

function getTargetRadius() {
  return Math.max(15, Math.min(23, Math.min(game.width, game.height) * 0.045));
}

function getTargetBounds(radius) {
  const minX = radius + 16;
  const maxX = Math.max(minX, game.width - radius - 16);
  const minY = radius + 76;
  const maxY = Math.max(minY, game.height - radius - 65);

  return { minX, maxX, minY, maxY };
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

  game.targets.forEach((target) => {
    const limits = getTargetBounds(target.radius);
    target.x = Math.max(limits.minX, Math.min(limits.maxX, target.x));
    target.y = Math.max(limits.minY, Math.min(limits.maxY, target.y));
  });
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

function drawTargets(timestamp) {
  game.targets.forEach((target) => {
    const tint = target.type === "green" ? colors.green : colors.red;
    const pulse = 1 + Math.sin(timestamp * 0.006 + target.pulseOffset) * 0.045;
    const radius = target.radius * pulse;

    context.beginPath();
    context.fillStyle = target.type === "green"
      ? "rgba(88, 255, 155, 0.12)"
      : "rgba(255, 83, 124, 0.13)";
    context.shadowBlur = 22;
    context.shadowColor = tint;
    context.arc(target.x, target.y, radius + 5, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.strokeStyle = tint;
    context.lineWidth = 2;
    context.arc(target.x, target.y, radius, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.strokeStyle = target.type === "green"
      ? "rgba(88, 255, 155, 0.55)"
      : "rgba(255, 83, 124, 0.58)";
    context.lineWidth = 1;
    context.arc(target.x, target.y, radius * 0.66, 0, Math.PI * 2);
    context.stroke();

    context.shadowBlur = 0;
    context.fillStyle = tint;
    context.font = "600 17px 'Space Grotesk', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(target.type === "green" ? "+" : "−", target.x, target.y - 1);
  });
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
  drawTargets(timestamp);
}

function getDifficulty() {
  const progress = Math.min(game.elapsedSeconds / GAME_DURATION_SECONDS, 1);

  return {
    spawnInterval: 1.2 - progress * 0.65,
    targetLifetime: 2.8 - progress * 1.35,
  };
}

function spawnTarget() {
  if (game.targets.length >= MAX_TARGETS || game.width <= 0 || game.height <= 0) {
    return;
  }

  const radius = getTargetRadius();
  const bounds = getTargetBounds(radius);
  const difficulty = getDifficulty();

  game.targets.push({
    type: Math.random() < GREEN_TARGET_CHANCE ? "green" : "red",
    x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
    y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
    radius,
    remainingSeconds: difficulty.targetLifetime,
    lifetime: difficulty.targetLifetime,
    pulseOffset: Math.random() * Math.PI * 2,
  });
}

function updateTargets(deltaSeconds) {
  for (let index = game.targets.length - 1; index >= 0; index -= 1) {
    const target = game.targets[index];
    target.remainingSeconds -= deltaSeconds;

    if (target.remainingSeconds <= 0) {
      game.targets.splice(index, 1);
    }
  }
}

function formatScore(score) {
  if (score < 0) {
    return `-${String(Math.abs(score)).padStart(5, "0")}`;
  }

  return String(score).padStart(6, "0");
}

function updateHud() {
  const displayedTime = String(Math.ceil(game.timeLeft)).padStart(2, "0");
  const formattedScore = formatScore(game.score);

  if (scoreDisplay.textContent !== formattedScore) {
    scoreDisplay.textContent = formattedScore;
  }

  if (timeDisplay.textContent !== displayedTime) {
    timeDisplay.textContent = displayedTime;
    timeDisplay.setAttribute("aria-label", `${Number(displayedTime)} seconds remaining`);
  }

  finalScoreDisplay.textContent = formatScore(game.finalScore);
}

function updateInterface() {
  const isReady = game.phase === "ready";
  const isPlaying = game.phase === "playing";
  const isPaused = game.phase === "paused";
  const isGameover = game.phase === "gameover";

  gameShell.dataset.phase = game.phase;
  startScreen.hidden = !isReady;
  pauseScreen.hidden = !isPaused;
  gameoverScreen.hidden = !isGameover;
  playingMessage.hidden = !isPlaying;
  pauseButton.hidden = !isPlaying && !isPaused;
  pauseLabel.textContent = isPaused ? "RESUME" : "PAUSE";
  pauseButton.setAttribute("aria-label", isPaused ? "Resume game" : "Pause game");
  updateHud();
}

function resetRun() {
  game.elapsedSeconds = 0;
  game.timeLeft = GAME_DURATION_SECONDS;
  game.score = 0;
  game.finalScore = 0;
  game.spawnTimer = 0;
  game.targets.length = 0;
}

function startGame() {
  if (game.phase !== "ready") {
    return;
  }

  resetRun();
  game.phase = "playing";
  updateInterface();
}

function restartGame() {
  if (game.phase !== "gameover") {
    return;
  }

  resetRun();
  game.phase = "playing";
  updateInterface();
}

function returnToTitle() {
  if (game.phase !== "gameover") {
    return;
  }

  resetRun();
  game.phase = "ready";
  updateInterface();
}

function endGame() {
  game.timeLeft = 0;
  game.finalScore = game.score;
  game.targets.length = 0;
  game.phase = "gameover";
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

function updateGameplay(deltaSeconds) {
  game.elapsedSeconds = Math.min(game.elapsedSeconds + deltaSeconds, GAME_DURATION_SECONDS);
  game.timeLeft = Math.max(0, GAME_DURATION_SECONDS - game.elapsedSeconds);
  updateTargets(deltaSeconds);

  if (game.timeLeft <= 0) {
    endGame();
    return;
  }

  game.spawnTimer -= deltaSeconds;

  if (game.spawnTimer <= 0) {
    spawnTarget();
    game.spawnTimer = getDifficulty().spawnInterval;
  }

  updateHud();
}

function handlePointerDown(event) {
  if (game.phase !== "playing" || event.isPrimary === false) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const bounds = canvas.getBoundingClientRect();

  if (bounds.width === 0 || bounds.height === 0) {
    return;
  }

  event.preventDefault();
  const x = (event.clientX - bounds.left) * (game.width / bounds.width);
  const y = (event.clientY - bounds.top) * (game.height / bounds.height);

  for (let index = game.targets.length - 1; index >= 0; index -= 1) {
    const target = game.targets[index];
    const distanceX = x - target.x;
    const distanceY = y - target.y;

    if (distanceX * distanceX + distanceY * distanceY <= target.radius * target.radius) {
      game.score += target.type === "green" ? 10 : -5;
      game.targets.splice(index, 1);
      updateHud();
      return;
    }
  }
}

function handleKeydown(event) {
  if (event.repeat) {
    return;
  }

  if (game.phase === "ready" && event.key === "Enter") {
    startGame();
    return;
  }

  if (game.phase === "gameover" && event.key === "Enter") {
    restartGame();
    return;
  }

  if (game.phase === "playing" || game.phase === "paused") {
    if (event.code === "Space" || event.key.toLowerCase() === "p") {
      event.preventDefault();
      togglePause();
    }
  }
}

function handleVisibilityChange() {
  if (document.hidden && game.phase === "playing") {
    togglePause();
  }
}

function gameLoop(timestamp) {
  const deltaSeconds = game.lastFrameTime === 0
    ? 0
    : Math.max(0, (timestamp - game.lastFrameTime) / 1000);

  game.lastFrameTime = timestamp;

  if (game.phase === "playing") {
    updateGameplay(deltaSeconds);
  }

  if (game.phase !== "paused") {
    updateParticles(deltaSeconds);
  }

  drawBackground(timestamp);
  window.requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);
returnButton.addEventListener("click", returnToTitle);
canvas.addEventListener("pointerdown", handlePointerDown);
window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", resizeCanvas);
document.addEventListener("visibilitychange", handleVisibilityChange);

resizeCanvas();
updateInterface();
window.requestAnimationFrame(gameLoop);
