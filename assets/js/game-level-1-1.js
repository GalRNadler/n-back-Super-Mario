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
  colors: ['blue', 'green'],
  // colors: ["red", "pink", "orange"],
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
  movingToMushroom: false,  
  targetX: 0, 
  returningToStart: false,
  startX: 25,
  startY: canvas.height - config.floorHeight - config.playerSize,
  jumpingToMushroom: false,
  jumpProgress: 0,
  jumpStartX: 0,
  jumpStartY: 0,
  jumpTargetX: 0,
  jumpTargetY: 0,
  mushroomHistory: [],
  mushroomsAppeared: 0,
  lastScoredMushroomIndex: -1,
  score: 0,
  returningToStart: false,
  
};

let one_back = true;


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

// Load music
const backgroundMusic = new Audio("assets/sounds/super_mario_theme.mp3");
backgroundMusic.loop = true;

// Game loop
function gameLoop(timestamp) {
  if (!gameState.gameRunning || gameState.paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateBackground();
  updateScenery();
  updateClouds();
  updatePlayer();
  updateMushrooms(timestamp);
  // limitMushroomHistory();
  checkCollisions();
  updateScore();
  requestAnimationFrame(gameLoop);
  // logExpectedHistory();
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
  } else if (event.key === "ArrowRight") {
    moveToMushroom();
  } else if (event.key === "ArrowUp" && !gameState.jumping) {
    gameState.jumping = true;
    gameState.jumpVelocity = -Math.sqrt(2 * 0.8 * config.jumpHeight);
  }
}

// updatePlayer function
function updatePlayer() {
  if (gameState.jumpingToMushroom) {
    gameState.jumpProgress += 0.05; // Adjust this value to change jump speed

    if (gameState.jumpProgress >= 1) {
      gameState.jumpingToMushroom = false;
      gameState.playerPosition.x = gameState.jumpTargetX;
      gameState.playerPosition.y = gameState.jumpTargetY;
      collectMushroom();
      returnToStart();
    } else {
      // Parabolic jump motion
      const jumpHeight = 100; // Adjust this value to change jump height
      gameState.playerPosition.x = lerp(gameState.jumpStartX, gameState.jumpTargetX, gameState.jumpProgress);
      gameState.playerPosition.y = lerp(gameState.jumpStartY, gameState.jumpTargetY, gameState.jumpProgress) 
                                   - Math.sin(gameState.jumpProgress * Math.PI) * jumpHeight;
    }
  } else if (gameState.returningToStart) {
    const moveSpeed = 7; // Slowed down return speed
    
    // Horizontal movement
    if (gameState.playerPosition.x > gameState.startX) {
      gameState.playerPosition.x -= moveSpeed;
    } else {
      gameState.playerPosition.x = gameState.startX;
    }
    
    // Vertical movement
    if (gameState.playerPosition.y < gameState.startY) {
      gameState.playerPosition.y += moveSpeed;
    } else {
      gameState.playerPosition.y = gameState.startY;
    }
    
    // Check if Mario has returned to the start position
    if (Math.abs(gameState.playerPosition.x - gameState.startX) < moveSpeed && 
        Math.abs(gameState.playerPosition.y - gameState.startY) < moveSpeed) {
      gameState.playerPosition.x = gameState.startX;
      gameState.playerPosition.y = gameState.startY;
      gameState.returningToStart = false;
      gameState.currentMushroom = null;
      gameState.lastMushroomTime = performance.now();
    }
  }

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

const MUSHROOM_COOLDOWN = 500;

function updateMushrooms(timestamp) {
  // Generate new mushroom if needed
  if ((gameState.currentMushroom === null || 
      gameState.currentMushroom.x + config.mushroomSize < 0 || 
      gameState.currentMushroom.collected) && 
     !gameState.returningToStart &&
     timestamp - gameState.lastMushroomTime > MUSHROOM_COOLDOWN) {
    
    // Generate a new mushroom
    gameState.currentMushroom = generateMushroom();
    gameState.lastMushroomTime = timestamp;
    
    // Add the new mushroom to history
    gameState.mushroomHistory.push({
      color: gameState.currentMushroom.color,
      collected: false
    });
    
    // Keep only the last 5 mushrooms in history
    if (gameState.mushroomHistory.length > 5) {
      gameState.mushroomHistory.shift();
    }
    
    console.log("New mushroom generated:", gameState.currentMushroom.color);
    console.log("Updated mushroom history:", gameState.mushroomHistory.map(m => m.color));
  }

  // Update current mushroom position
  if (gameState.currentMushroom && !gameState.currentMushroom.collected) {
    gameState.currentMushroom.x -= config.gameSpeed;
    
    // Draw the mushroom
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
    // Collision detected, call collectMushroom
    collectMushroom();
  }
}

// Score update
function updateScore() {
  scoreElement.textContent = gameState.score;
}

// Start game
function startGame() {
  gameState.gameRunning = true;
  gameState.paused = false;
  gameState.score = 0;
  gameState.mushroomsAppeared = 0;
  gameState.mushroomHistory = [];
  gameState.playerPosition = {
    x: 50,
    y: canvas.height - config.floorHeight - config.playerSize,
  };
  gameState.lastMushroomTime = 0;
  gameState.currentMushroom = null;
  playButton.disabled = true;
  pauseButton.disabled = false;

  // Move Mario away from the pipe
  setTimeout(() => {
    const moveInterval = setInterval(() => {
      gameState.playerPosition.x += 2;
      if (gameState.playerPosition.x >= 50) {
        // Move to x position 150
        clearInterval(moveInterval);
      }
    }, 20);
  }, 800); // Wait 1 second before moving

  if (!gameState.muted) {
    backgroundMusic.play().catch((e) => console.log("Audio play failed:", e));
  }

  requestAnimationFrame(gameLoop);
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
  playButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", pauseGame);
  muteButton.addEventListener("click", toggleMute);
  lazyLoadBackgroundElements();
  drawInitialScene();
}

// Draw initial scene
function drawInitialScene() {
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

// moveToMushroom function
function moveToMushroom() {
  if (gameState.currentMushroom && !gameState.currentMushroom.collected && !gameState.returningToStart) {
    gameState.jumpingToMushroom = true;
    gameState.jumpProgress = 0;
    gameState.jumpStartX = gameState.playerPosition.x;
    gameState.jumpStartY = gameState.playerPosition.y;
    gameState.jumpTargetX = gameState.currentMushroom.x - config.playerSize / 2;
    gameState.jumpTargetY = gameState.currentMushroom.y + config.mushroomSize - config.playerSize;
  }
}

// function returnToStart() {
//   gameState.returningToStart = true;
//   gameState.startX = 25; // Or whatever X position you want Mario to return to
//   gameState.startY = canvas.height - config.floorHeight - config.playerSize;
// }

// collectMushroom function
function collectMushroom() {
  if (gameState.currentMushroom && !gameState.currentMushroom.collected) {
    const currentIndex = gameState.mushroomHistory.length - 1;
    
    console.log("Collecting mushroom:", gameState.currentMushroom.color);
    console.log("Current mushroom history:", gameState.mushroomHistory.map(m => m.color));
    
    if (one_back) {
      if (currentIndex >= 1) {
        const oneBackMushroom = gameState.mushroomHistory[currentIndex - 1];
        if (oneBackMushroom.color === gameState.currentMushroom.color) {
          gameState.score += 10;
          console.log(`Correct match! +10 points (Current: ${currentIndex + 1}, Matched: ${currentIndex})`);
        } else {
          gameState.score -= 5;
          console.log(`Incorrect match. -5 points (Current: ${currentIndex + 1}, Compared: ${currentIndex})`);
        }
      } else {
        gameState.score -= 5;
        console.log(`Too early. -5 points (Current: ${currentIndex + 1})`);
      }
    }

    gameState.currentMushroom.collected = true;
    gameState.mushroomHistory[currentIndex].collected = true;
    updateScore();
    gameState.returningToStart = true;
    gameState.currentMushroom = null; 
    
  }
}

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
    collected: false
  };
}

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// function limitMushroomHistory() {
//   const maxHistorySize = 20; // Adjust as needed
//   if (gameState.mushroomHistory.length > maxHistorySize) {
//     gameState.mushroomHistory = gameState.mushroomHistory.slice(-maxHistorySize);
//   }
// }

function returnToStart() {
  gameState.returningToStart = true;
  const moveSpeed = 7; // Adjusted for smoother movement
  
  function moveStep() {
    // Horizontal movement
    if (gameState.playerPosition.x > gameState.startX) {
      gameState.playerPosition.x -= moveSpeed;
    } else {
      gameState.playerPosition.x = gameState.startX;
    }
    
    // Vertical movement
    if (gameState.playerPosition.y < gameState.startY) {
      gameState.playerPosition.y += moveSpeed;
    } else {
      gameState.playerPosition.y = gameState.startY;
    }
    
    // Check if Mario has returned to the start position
    if (Math.abs(gameState.playerPosition.x - gameState.startX) < moveSpeed && 
        Math.abs(gameState.playerPosition.y - gameState.startY) < moveSpeed) {
      gameState.playerPosition.x = gameState.startX;
      gameState.playerPosition.y = gameState.startY;
      gameState.returningToStart = false;
      gameState.currentMushroom = null;
      gameState.lastMushroomTime = performance.now();
    } else {
      requestAnimationFrame(moveStep);
    }
  }
  
  moveStep();
}

// function logExpectedHistory() {
//   const visibleMushrooms = [];
//   let x = canvas.width;
//   while (x > 0) {
//     const colorIndex = Math.floor(Math.random() * config.colors.length);
//     const color = config.colors[colorIndex];
//     visibleMushrooms.unshift(color);
//     x -= (config.mushroomSize + 50); // Assuming some space between mushrooms
//   }
//   console.log("Expected mushroom history (based on screen):", visibleMushrooms);
// 
