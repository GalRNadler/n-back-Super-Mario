const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const muteButton = document.getElementById("muteButton");

// Game configuration
const config = {
  // nBack: 2,
  // colors: ['red', 'green', 'yellow' , 'blue', 'pink','orange'],
  // colors: ['blue', 'green'],
  colors: ["red", "pink", "orange"],
  gameSpeed: 7,
  mushroomFrequency: 100,
  playerSize: 70,
  mushroomSize: 81,
  pipeWidth: 70,
  pipeHeight: 100,
  jumpHeight: 300, // Adjust this to change jump height
  maxMushroomHeight: 250, // Adjust this to limit mushroom height
  cloudCount: 4,
  cloudScale: 0.5, // Add this line to scale down the clouds
  floorHeight: 50, // Add this line to define the floor height
  treeCount: 3,
  bushCount: 5,
  treeSize: { width: 100, height: 120 },
  bushSize: { width: 60, height: 40 },
};

// Game state
let gameState = {
  score: 0,
  mushroomHistory: [],
  playerPosition: {
    x: 25,
    y: canvas.height - config.pipeHeight - config.playerSize,
  },
  jumping: false,
  jumpVelocity: 0,
  gameRunning: false,
  lastMushroomTime: 0,
  currentMushroom: null,
  paused: false,
  muted: false,
  targetMushroom: null,
  showingOpeningPage: true,

};

let one_back = true;

function showOpeningPage() {
  const openingText = [
      "Welcome to the 0-Back Mario Mushroom Game!",
      "",
      "Rules:",
      "1. Memorize the target mushroom shown at the start.",
      "2. Use arrow keys to move Mario:",
      "   - Left/Right to move horizontally",
      "   - Up to jump",
      "3. Collect mushrooms that match the target.",
      "4. Correct matches: +10 points",
      "5. Incorrect matches: -5 points",
      "6. The target mushroom will disappear when you start the game.",
      "",
      "Good luck and have fun!",
      "Press 'Next page' to start the game."
  ];

  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  const lineHeight = 30;
  const startY = 50;

  openingText.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function startGameFromOpeningPage() {
  if (gameState.showingOpeningPage) {
      gameState.showingOpeningPage = false;
      startGame();
  }
}
//____________________________________________//
// Load images
const playerImage = new Image();
playerImage.src = "assets/images/Super_Mario.png";
const player1Image = new Image();
player1Image.src = "assets/images/Super_Mario1.png";

const mushroomImages = {};

function loadMushroomImage(color) {
  if (!mushroomImages[color]) {
    mushroomImages[color] = new Image();
    mushroomImages[color].src = `assets/images/${color}_mushroom.png`;
    console.log(`Loading mushroom image: ${mushroomImages[color].src}`);
  }
  return mushroomImages[color];
}
const pipeImage = new Image();
pipeImage.src = "assets/images/green_pipe.png";

const cloudImage = new Image();
cloudImage.src = "assets/images/cloud.png";

const treeImage = new Image();
treeImage.src = "assets/images/tree.png";

const bushImage = new Image();
bushImage.src = "assets/images/bush.png";

const brickImage = new Image();
brickImage.src = "assets/images/brick.png";
const floorImage = new Image();
floorImage.src = "assets/images/floor_tile.png";
let floorX = 0;

const clouds = Array(config.cloudCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * (canvas.height / 2),
    speed: 0.5 + Math.random() * 0.5,
  }));

function updateClouds() {
  if (!cloudImage.complete) return;

  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloudImage.width * config.cloudScale < 0) {
      cloud.x = canvas.width;
      cloud.y = Math.random() * (canvas.height / 2);
    }
    ctx.drawImage(
      cloudImage,
      cloud.x,
      cloud.y,
      cloudImage.width * config.cloudScale,
      cloudImage.height * config.cloudScale
    );
  });
}
const trees = Array(config.treeCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height - config.floorHeight - config.treeSize.height,
  }));

const bushes = Array(config.bushCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height - config.floorHeight - config.bushSize.height,
  }));

function updateScenery() {
  const treeSpeed = config.gameSpeed * 0.5;
  const bushSpeed = config.gameSpeed * 0.7;

  trees.forEach((tree) => {
    tree.x -= treeSpeed;
    if (tree.x + config.treeSize.width < 0) {
      tree.x = canvas.width;
      tree.y = canvas.height - config.floorHeight - config.treeSize.height;
    }
  });

  bushes.forEach((bush) => {
    bush.x -= bushSpeed;
    if (bush.x + config.bushSize.width < 0) {
      bush.x = canvas.width;
      bush.y = canvas.height - config.floorHeight - config.bushSize.height;
    }
  });
}

function generateTargetMushroom() {
  const colorIndex = Math.floor(Math.random() * config.colors.length);
  const color = config.colors[colorIndex];
  const image = loadMushroomImage(color);
  gameState.targetMushroom = { color, image };
  console.log("Target mushroom generated:", color);
}

function drawTargetMushroom() {
  if (gameState.targetMushroom) {
      ctx.drawImage(
          gameState.targetMushroom.image,
          canvas.width / 2 - config.mushroomSize / 2,
          50,
          config.mushroomSize,
          config.mushroomSize
      );
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      ctx.fillText('Target:', canvas.width / 2 - 60, 40);
      console.log("Target mushroom drawn");
  } else {
      console.log("No target mushroom to draw");
  }
}

// Load music
const backgroundMusic = new Audio("assets/sounds/super_mario_theme.mp3");
backgroundMusic.loop = true;

// Game loop
function gameLoop(timestamp) {
  if (!gameState.gameRunning || gameState.paused) {
      drawInitialScene();
      if (gameState.showingOpeningPage) {
          showOpeningPage();
      }
      requestAnimationFrame(gameLoop);
      return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateBackground();
  updateScenery();
  updateClouds();
  updatePlayer();
  updateMushrooms(timestamp);
  checkCollisions();
  updateScore();

  requestAnimationFrame(gameLoop);
}

// Background
function updateBackground() {
  ctx.fillStyle = "#619FFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const floorY = canvas.height - config.floorHeight;
  // Draw the floor tiles
  if (floorImage.complete) {
    for (let x = floorX; x < canvas.width; x += floorImage.width) {
      ctx.drawImage(
        floorImage,
        x,
        floorY,
        floorImage.width,
        config.floorHeight
      );
    }
  }

  if (treeImage.complete) {
    trees.forEach((tree) => {
      ctx.drawImage(
        treeImage,
        tree.x,
        tree.y,
        config.treeSize.width,
        config.treeSize.height
      );
      tree.y = canvas.height - config.floorHeight - config.treeSize.height + 17;
    });
  }

  if (bushImage.complete) {
    bushes.forEach((bush) => {
      ctx.drawImage(
        bushImage,
        bush.x,
        bush.y,
        config.bushSize.width,
        config.bushSize.height
      );
      bush.y =
        canvas.height - config.floorHeight - config.bushSize.height + 7.5;
    });
  }
  floorX -= config.gameSpeed;
  if (floorX <= -floorImage.width) {
    floorX = 0;
  }
}

// Draw pipe
function drawPipe() {
  ctx.drawImage(
    pipeImage,
    20,
    canvas.height - config.pipeHeight - 40,
    config.pipeWidth,
    config.pipeHeight
  );
}

// Player controls and update
function handleInput(event) {
  if (!gameState.gameRunning || gameState.paused) return;

  if (event.key === "ArrowLeft" && gameState.playerPosition.x > 20) {
    gameState.playerPosition.x -= 5;
  } else if (
    event.key === "ArrowRight" &&
    gameState.playerPosition.x < canvas.width - config.playerSize
  ) {
    gameState.playerPosition.x += 5;
  } else if (event.key === "ArrowUp" && !gameState.jumping) {
    gameState.jumping = true;
    gameState.jumpVelocity = -Math.sqrt(2 * 0.8 * config.jumpHeight);
  }
}

function updatePlayer() {
  if (gameState.jumping) {
    gameState.playerPosition.y += gameState.jumpVelocity;
    gameState.jumpVelocity += 0.8;
    const floorY = canvas.height - config.floorHeight - config.playerSize;
    if (gameState.playerPosition.y >= floorY) {
      gameState.playerPosition.y = floorY;
      gameState.jumping = false;
      gameState.jumpVelocity = 0;
    }
  }
  ctx.drawImage(
    playerImage,
    gameState.playerPosition.x,
    gameState.playerPosition.y,
    config.playerSize,
    config.playerSize
  );
}

// Mushroom generation and update
function generateMushroom() {
  const colorIndex = Math.floor(Math.random() * config.colors.length);
  const color = config.colors[colorIndex];
  const minY = canvas.height - config.maxMushroomHeight - config.floorHeight;
  const maxY = canvas.height - config.floorHeight - config.mushroomSize;
  return {
    x: canvas.width,
    y: Math.random() * (maxY - minY) + minY,
    color: color,
    image: loadMushroomImage(color),
    collected: false,
  };
}

function updateMushrooms(timestamp) {
  if (
    !gameState.currentMushroom ||
    gameState.currentMushroom.x + config.mushroomSize < 0 ||
    gameState.currentMushroom.collected
  ) {
    if (timestamp - gameState.lastMushroomTime >= config.mushroomFrequency) {
      gameState.currentMushroom = generateMushroom();
      gameState.lastMushroomTime = timestamp;
    }
  }

  if (gameState.currentMushroom && !gameState.currentMushroom.collected) {
    gameState.currentMushroom.x -= config.gameSpeed;
    ctx.drawImage(
      gameState.currentMushroom.image,
      gameState.currentMushroom.x,
      gameState.currentMushroom.y,
      config.mushroomSize,
      config.mushroomSize
    );
  }
}

// Collision detection
function checkCollisions() {
  if (!gameState.currentMushroom || gameState.currentMushroom.collected) return;

  const player = {
    x: gameState.playerPosition.x,
    y: gameState.playerPosition.y,
    width: config.playerSize,
    height: config.playerSize,
  };

  const mushroom = gameState.currentMushroom;

  if (
    player.x < mushroom.x + config.mushroomSize &&
    player.x + player.width > mushroom.x &&
    player.y < mushroom.y + config.mushroomSize &&
    player.y + player.height > mushroom.y
  ) {
    if (mushroom.color === gameState.targetMushroom.color) {
      gameState.score += 10;
      console.log("Correct match! +10 points");
    } else {
      gameState.score -= 5;
      console.log("Incorrect match. -5 points");
    }

    // Mark the mushroom as collected
    gameState.currentMushroom.collected = true;
  }
}

// Score update
function updateScore() {
  scoreElement.textContent = gameState.score;
}

// Start game
function startGame() {
  console.log("Starting game");
  gameState.gameRunning = true;
  gameState.paused = false;
  gameState.score = 0;
  gameState.mushroomHistory = [];
  gameState.playerPosition = {
      x: 50,
      y: canvas.height - config.floorHeight - config.playerSize,
  };
  gameState.lastMushroomTime = 0;
    gameState.currentMushroom = null;
    gameState.showingOpeningPage = false;
    gameState.targetMushroom.visible = false; // Hide the target mushroom
    playButton.disabled = true;
    pauseButton.disabled = false;

  // Don't clear the target mushroom
  // gameState.targetMushroom = null;

  requestAnimationFrame(gameLoop);

  if (!gameState.muted) {
      backgroundMusic.play().catch((e) => console.log("Audio play failed:", e));
  }
}

// Pause game
function pauseGame() {
  gameState.paused = !gameState.paused;
  pauseButton.textContent = gameState.paused ? "Resume" : "Pause";
  if (gameState.paused) {
    backgroundMusic.pause();
  } else {
    resumeGame(); // Add this function call
  }
}

function resumeGame() {
  if (!gameState.muted) {
    backgroundMusic.play().catch((e) => console.log("Audio play failed:", e));
  }
  requestAnimationFrame(gameLoop);
}

// Mute/unmute audio
function toggleMute() {
  gameState.muted = !gameState.muted;
  muteButton.textContent = gameState.muted ? "Unmute" : "Mute";
  backgroundMusic.muted = gameState.muted;
}

// Main game initialization
function initGame() {
  document.addEventListener("keydown", handleInput);
  playButton.addEventListener("click", startGameFromOpeningPage);
  pauseButton.addEventListener("click", pauseGame);
  muteButton.addEventListener("click", toggleMute);
  
  preloadImages(() => {
      console.log("All images loaded");
      generateTargetMushroom();
      drawInitialScene();
      showOpeningPage();
  });
}

// Draw initial scene
function drawInitialScene() {
  console.log("Drawing initial scene");
  ctx.fillStyle = "#619FFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const floorY = canvas.height - config.floorHeight;
  drawPipe();
  if (floorImage.complete) {
    for (let x = 0; x < canvas.width; x += floorImage.width) {
      ctx.drawImage(
        floorImage,
        x,
        floorY,
        floorImage.width,
        config.floorHeight
      );
    }
  }

  if (treeImage.complete) {
    trees.forEach((tree) => {
      ctx.drawImage(
        treeImage,
        tree.x,
        tree.y,
        config.treeSize.width,
        config.treeSize.height + 17
      );
      tree.y = canvas.height - config.floorHeight - config.treeSize.height;
    });
  }

  if (bushImage.complete) {
    bushes.forEach((bush) => {
      ctx.drawImage(
        bushImage,
        bush.x,
        bush.y,
        config.bushSize.width,
        config.bushSize.height + 7.5
      );
      bush.y = canvas.height - config.floorHeight - config.bushSize.height;
    });
  }

  ctx.drawImage(
    player1Image,
    gameState.playerPosition.x - 7,
    gameState.playerPosition.y - 40,
    config.playerSize,
    config.playerSize
  );

  console.log("Generating target mushroom");
  // generateTargetMushroom();
  // drawTargetMushroom();
}
// Start the game when images are loaded
// Promise.all([
//     playerImage.onload,
//     pipeImage.onload,
//     ...mushroomImages.map(img => img.onload),
//     treeImage.onload,
//     // bushImage.onload,
//     // brickImage.onload,
//     floorImage.onload
// ]).then(() => {
//     initGame();
// });

function debugGameState() {
  console.log(
    "Mushroom History:",
    gameState.mushroomHistory.map((m) => m.color)
  );
  console.log("Current Score:", gameState.score);
}

const essentialImages = [playerImage, floorImage, pipeImage];
Promise.all(
  essentialImages.map((img) => new Promise((resolve) => (img.onload = resolve)))
).then(() => initGame());

function lazyLoadBackgroundElements() {
  const backgroundImages = [treeImage, bushImage, cloudImage, floorImage];
  backgroundImages.forEach((img) => {
    if (!img.src) {
      img.src = img.dataset.src;
    }
  });
}
window.onload = function() {
  console.log("Window loaded, initializing game");
  initGame().catch(error => console.error("Error initializing game:", error));
};

function preloadImages(callback) {
  const imagesToLoad = [
      playerImage,
      player1Image,
      pipeImage,
      cloudImage,
      treeImage,
      bushImage,
      brickImage,
      floorImage,
      ...config.colors.map(color => loadMushroomImage(color))
  ];

  let loadedImages = 0;
  imagesToLoad.forEach(img => {
      if (img.complete) {
          loadedImages++;
      } else {
          img.onload = () => {
              loadedImages++;
              if (loadedImages === imagesToLoad.length) {
                  callback();
              }
          };
      }
  });

  // If all images are already loaded, call the callback immediately
  if (loadedImages === imagesToLoad.length) {
      callback();
  }
}

// function showLoadingScreen() {
//     ctx.fillStyle = 'black';
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = 'white';
//     ctx.font = '30px Arial';
//     ctx.fillText('Loading...', canvas.width/2 - 50, canvas.height/2);
// }

// Call this before loading assets
// showLoadingScreen();
