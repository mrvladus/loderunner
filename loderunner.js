// Map
let field = [
  [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 3, 0, 4, 0, 3, 0, 0, 2, 2, 2, 2, 3, 2, 2, 2, 2],
  [0, 0, 2, 2, 2, 2, 2, 2, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
];
let HEIGHT = field.length - 1;
let WIDTH = field[0].length - 1;
// Positions
let player = {
  y: 5,
  x: 4,
  direction: "right",
  onfloor: true,
  onladder: false,
  onwall: false,
  digging: false,
  moving: false,
};
let enemies = [
  { y: 0, x: 0, onfloor: true, onladder: false, onwall: true, inhole: false },
];
// State variables
let speed = 100; // less is faster
let score = 0;
let gameover = false;
let holes = [];
// DOM stuff
let level = document.getElementById("level");
let scoreCounter = document.getElementById("score");
// Controls
document.addEventListener("keyup", playerControls);
// Screen update
function updateScreen(field) {
  // Blank the screen
  let output = "";
  for (let y = 0; y < field.length; y++) {
    for (let x = 0; x < field[y].length; x++) {
      // Air
      if (field[y][x] === 0) {
        output += " ";
      }
      // Player
      if (field[y][x] === 1) {
        output += "&";
      }
      // Floor
      if (field[y][x] === 2) {
        output += "=";
      }
      // Ladder
      if (field[y][x] === 3) {
        output += "#";
      }
      // Gold
      if (field[y][x] === 4) {
        output += "$";
      }
      // Enemy
      if (field[y][x] === 5) {
        output += "@";
      }
    }
    // Add new line
    output += "\n";
  }
  // Update screen
  level.innerHTML = output;
  // Update score
  scoreCounter.innerHTML = `SCORE: ${score}`;
}

function updateField(field) {
  // Copy map of level
  let newField = [];
  for (let i = 0; i < field.length; i++) {
    let tmp = [];
    for (let j = 0; j < field[i].length; j++) {
      tmp.push(field[i][j]);
    }
    newField.push(tmp);
  }
  // Draw holes
  for (let y = 0; y < holes.length; y++) {
    field[holes[y].y][holes[y].x] = 0;
  }
  // Collect gold if player on this cell
  collectGold(field);
  // Draw player on map
  newField[player.y][player.x] = 1;
  // Draw enemies
  drawEnemy(newField);
  // Check collisions
  checkOnFloor(player, newField);
  checkOnWall(player);
  checkOnLadder(player);
  // Adding gravity
  addGravity(player);
  // Digging a hole in floor
  digAHole(newField);
  // Update the screen
  updateScreen(newField);
}
// Key controls
function playerControls(e) {
  // Move right
  if (
    (player.onfloor || player.onladder) &&
    !player.onwall &&
    (e.key == "Right" || e.key == "ArrowRight")
  ) {
    player.x++;
    player.direction = "right";
  }
  // Move left
  if (
    (player.onfloor || player.onladder) &&
    !player.onwall &&
    e.key == "ArrowLeft"
  ) {
    player.x--;
    player.direction = "left";
  }
  // Move up on the ladder
  if (
    player.onladder &&
    field[player.y - 1][player.x] === 3 &&
    e.key == "ArrowUp"
  ) {
    player.y--;
  }
  // Move down on the ladder
  if (!player.onfloor && e.key == "ArrowDown") {
    player.y++;
  }
  // Dig a hole on "Spacebar"
  if (e.key == " ") {
    player.digging = true;
  }
  // Restart game on "R" press
  if (e.key == "r") {
    document.location.reload();
  }
  checkScreenCollision(player);
  player.moving = true;
}

function digAHole(field) {
  if (field[player.y + 1] && player.onfloor && player.digging) {
    // Check direction of the player and if ladder is around
    if (player.direction === "right" && field[player.y][player.x + 1] !== 3) {
      holes.push({ y: player.y + 1, x: player.x + 1 });
    }
    if (player.direction === "left" && field[player.y][player.x - 1] !== 3) {
      holes.push({ y: player.y + 1, x: player.x - 1 });
    }
  }
  player.digging = false;
}

// Collisions
// Borders of the screen
function checkScreenCollision(obj) {
  // Right side
  if (obj.x + 1 > WIDTH) {
    obj.x = WIDTH;
  } else if (obj.x - 1 < 0) {
    obj.x = 0;
  }
  //Left side
  if (obj.y + 1 > HEIGHT) {
    obj.y = HEIGHT;
  } else if (obj.y - 1 < 0) {
    obj.y = 0;
  }
}
// Check if obj is standing on the floor
function checkOnFloor(obj, field) {
  if (
    field[obj.y + 1] &&
    (field[obj.y + 1][obj.x] === 2 || field[obj.y + 1][obj.x] === 5)
  ) {
    obj.onfloor = true;
  } else {
    obj.onfloor = false;
  }
}
// Check if player climbing on ladder
function checkOnLadder(obj) {
  if (
    (field[obj.y - 1] && field[obj.y - 1][obj.x] === 3) ||
    (field[obj.y + 1] && field[obj.y + 1][obj.x] === 3)
  ) {
    obj.onladder = true;
  } else {
    obj.onladder = false;
  }
}
// Check if walls is on the sides of the player
function checkOnWall(obj) {
  if (
    (field[obj.y][obj.x - 1] && field[obj.y][obj.x - 1] === 2) ||
    (field[obj.y][obj.x + 1] && field[obj.y][obj.x + 1] === 2)
  ) {
    obj.onwall = true;
  } else {
    obj.onwall = false;
  }
}
// Add gravity to player and AI
function addGravity(obj) {
  if (!obj.onfloor && !obj.onladder) {
    obj.y++;
  }
}

// Check if game is over
function isGameOver(enemy) {
  if (enemy.x === player.x && enemy.y === player.y) {
    gameover = true;
  }
}

// Collect golden ignots and add score
function collectGold(field) {
  if (field[player.y][player.x] === 4) {
    score++;
    field[player.y][player.x] = 0;
  }
}

// Enemy AI
// Draw enemies on screen
function drawEnemy(field) {
  for (let i = 0; i < enemies.length; i++) {
    let enemy = enemies[i];
    isGameOver(enemy);
    field[enemy.y][enemy.x] = 5;
    moveEnemy(enemy);
  }
}
// Move enemies
function moveEnemy(enemy) {
  if (player.moving) {
    // Check collisions
    checkOnFloor(enemy, field);
    checkOnLadder(enemy);
    checkOnWall(enemy);
    // Add gravity
    if (!enemy.onfloor && !enemy.onladder) {
      enemy.y++;
      enemy.inhole = true;
      return;
    }
    // Move horizontal
    if (enemy.onfloor && !enemy.inhole) {
      if (enemy.x > player.x) {
        enemy.x--;
      } else if (enemy.x < player.x) {
        enemy.x++;
      }
    }
    // Move vertical
    if (enemy.onladder && !enemy.onfloor && !enemy.inhole) {
      if (enemy.y > player.y) {
        enemy.y--;
      } else if (enemy.y < player.y) {
        enemy.y++;
      }
    }
  }
  // Set state
  player.moving = false;
}

// Main game loop
function main() {
  setInterval(() => {
    if (!gameover) {
      updateField(field);
    } else {
      scoreCounter.innerHTML = `GAME OVER<br/>SCORE: ${score}<br/>PRESS "R" TO RESTART`;
    }
  }, speed);
}

main();

function debounce(f, ms) {
  let isCooldown = false;
  return function () {
    if (isCooldown) return;
    f.apply(this, arguments);
    isCooldown = true;
    setTimeout(() => (isCooldown = false), ms);
  };
}
