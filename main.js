"use strict";

// Initialize sound effects for the game
const shroomSound = new Audio("./assets/eat.mp3"); // Sound for eating a mushroom
const winSound = new Audio("./assets/win.mp3"); // Sound for winning the game

// Function to load a map from the specified file path
function loadMap(mapFilePath) {
  fetch(mapFilePath) // Fetch the map file from the server
    .then((response) => response.text()) // Convert the response to text
    .then((data) => {
      processMap(data); // Process the loaded map data
      startTimer(); // Start the timer for the level
    })
    .catch((error) => console.error("Error loading map:", error)); // Log any errors
}

// Function to process the content of the map
function processMap(data) {
  const lines = data.split("\n"); // Split the map data into lines

  // Iterate through each line of the map
  lines.forEach((line, rowIndex) => {
    let colStart = -1; // Initialize variable to track the start of a platform

    // Iterate through each character in the line
    for (let colIndex = 0; colIndex < line.length; colIndex++) {
      const char = line[colIndex]; // Get the character at the current column

      if (char === "%") {
        // If the character is "%", it marks the start of a platform
        if (colStart === -1) {
          colStart = colIndex; // Mark the start position
        }
      } else if (char === "&") {
        createPipe(rowIndex, colIndex); // Create a pipe at the specified position
      } else if (char === "$") {
        createShroom(rowIndex, colIndex); // Create a mushroom at the specified position
      } else if (char === "*") {
        createEndPole(rowIndex, colIndex); // Create an end pole at the specified position
      } else {
        // If we reach the end of a platform
        if (colStart !== -1) {
          createPlatforms(rowIndex, colStart, colIndex - 1); // Create the platform from start to end
          colStart = -1; // Reset the start position
        }

        // Process other characters
        if (char === "P") {
          // If the character is "P", place the player
          placePlayer(rowIndex, colIndex);
        } else if (char === "#") {
          // If the character is "#", create ground
          createGround(rowIndex, colIndex);
          groundTotal += colIndex; // Update the total ground value
        }
      }
    }
  });
}

// Function to start the timer for the current level
function startTimer() {
  levelStartTime = performance.now(); // Record the start time
  levelTimer = setInterval(() => {
    timeSpent = Math.floor((performance.now() - levelStartTime) / 1000); // Update time spent every second
  }, 1000); // Timer interval set to 1 second
}

// Load the map file based on the current map level stored in local storage
const mapToLoad = "./assets/map" + localStorage.getItem("map_level") + ".txt"; // Construct the file path
loadMap(mapToLoad); // Load the map

// BOX2DWEB Definitions
// Import necessary Box2D classes for physics simulation
var b2Vec2 = Box2D.Common.Math.b2Vec2; // Vector2 class for 2D coordinates
var b2BodyDef = Box2D.Dynamics.b2BodyDef; // Definition class for body
var b2Body = Box2D.Dynamics.b2Body; // Body class representing physical objects
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef; // Definition class for fixtures
var b2Fixture = Box2D.Dynamics.b2Fixture; // Fixture class for collision shapes
var b2World = Box2D.Dynamics.b2World; // World class for managing the simulation
var b2MassData = Box2D.Collision.Shapes.b2MassData; // Class for mass properties
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape; // Class for polygon shapes
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape; // Class for circle shapes
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw; // Class for debugging visualizations
var b2DestroyWorld = Box2D.Dynamics.b2DestroyWorld; // Class for destroying worlds

// Initialize the total ground variable
var groundTotal = 0;

// Define the world dimensions and scaling factor
var WIDTH = 40000; // Width of the world
var HEIGHT = 800; // Height of the world
var SCALE = 30; // Scaling factor for converting Box2D units to screen units

// Constants for grid dimensions
const CELL_WIDTH = 50; // Width of each cell in the grid
const CELL_HEIGHT = 50; // Height of each cell in the grid
const ROWS = Math.floor(HEIGHT / CELL_HEIGHT); // Calculate the number of rows based on height
const COLS = Math.floor(WIDTH / CELL_WIDTH); // Calculate the number of columns based on width

// Create a new Box2D world with gravity vector (0, 9.81) and sleep mode disabled
var world = new b2World(new b2Vec2(0, 9.81), false);

// Array to hold objects marked for destruction
var destroylist = [];

// Array to hold timestamps for various events
const times = [];

// Variable to hold frames per second (FPS) value
let fps;

// Initialize score variables
var score = 0; // Current score
var finalScore = 0; // Final score at the end of the game

// Player related variables
var player; // Variable to hold the player object

// Timer variables for level duration
let levelStartTime; // Time when the level started
let timeSpent = 0; // Total time spent in the level
let levelTimer; // Timer reference for updating the time spent

// Variables for EaselJS components
var easelCan, easelctx, loader, stage, stagewidth, stageheight; // Canvas and rendering variables

// Variables for different game objects
var easelground, // Ground object
  easelsky, // Sky background object
  easelsky2, // Second sky background object
  easelhill, // Hill object
  easealhill1, // First hill object
  easealhill2, // Second hill object
  hero, // Player character
  easelShroom, // Mushroom object
  easelPole; // Pole object

// Arrays to hold various game objects
var pole; // Variable to hold a pole object
var platforms = []; // Array to hold platform objects
var easelPlatforms = []; // Array to hold EaselJS platforms
var pipes = []; // Array to hold pipe objects
var easelPipes = []; // Array to hold EaselJS pipes
var shrooms = []; // Array to hold mushroom objects
var easelShrooms = []; // Array to hold EaselJS mushrooms
// Create the ground
function createGround(row, col) {
  // Calculate the X and Y positions for the ground based on column and row
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = HEIGHT - CELL_HEIGHT / 2; // Y position at the bottom of the screen

  // Define a new static ground body and return it
  return defineNewStatic(
    1.0, // Density
    0, // Friction
    0.2, // Restitution
    positionX, // X position
    positionY, // Y position
    CELL_WIDTH, // Width of the ground
    CELL_HEIGHT, // Height of the ground
    `ground_${row}_${col}`, // Unique object ID
    0 // User data (not used)
  );
}

// Create a platform spanning from colStart to colEnd in the specified row
function createPlatforms(row, colStart, colEnd) {
  const platformHeight = 24; // Height of the platform
  const platformWidth = (colEnd - colStart + 1) * CELL_WIDTH; // Width based on start and end columns
  const positionX = ((colStart + colEnd + 1) / 2) * CELL_WIDTH; // Centered X position of the platform
  const positionY = row * CELL_HEIGHT + platformHeight / 2; // Centered Y position of the platform

  // Define a new static platform body and push it to the platforms array
  const platform = defineNewStatic(
    1.0, // Density
    0.5, // Friction
    0.2, // Restitution
    positionX, // X position
    positionY, // Y position
    platformWidth, // Width of the platform
    platformHeight, // Height of the platform
    `plat${row}_${colStart}_${colEnd}`, // Unique object ID
    0 // User data (not used)
  );
  platforms.push(platform); // Add the platform to the platforms array
}

// Create an end pole at the specified row and column
function createEndPole(row, col) {
  // Calculate the X and Y positions for the end pole
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT * 5.5; // Y position higher in the screen

  // Define a new static pole body
  pole = defineNewStatic(
    1.0, // Density
    0, // Friction
    0.2, // Restitution
    positionX, // X position
    positionY, // Y position
    CELL_WIDTH, // Width of the pole
    CELL_HEIGHT, // Height of the pole
    `pole_${row}_${col}`, // Unique object ID
    0 // User data (not used)
  );
}

// Create a pipe at the specified row and column
function createPipe(row, col) {
  // Calculate the X and Y positions for the pipe
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT * 5.5; // Y position higher in the screen

  // Define a new static pipe body and push it to the pipes array
  const pipe = defineNewStatic(
    1.0, // Density
    0, // Friction
    0.2, // Restitution
    positionX, // X position
    positionY, // Y position
    CELL_WIDTH, // Width of the pipe
    CELL_HEIGHT, // Height of the pipe
    `pipe_${row}_${col}`, // Unique object ID
    0 // User data (not used)
  );
  pipes.push(pipe); // Add the pipe to the pipes array
}

// Create a shroom (dynamic object) at the specified row and column
function createShroom(row, col) {
  // Calculate the X and Y positions for the shroom
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT / 2; // Centered Y position

  // Define a new dynamic circle for the shroom and push it to the shrooms array
  const shroom = defineNewDynamicCircle(
    1.0, // Density
    0.2, // Friction
    0.1, // Restitution
    positionX, // X position
    positionY, // Y position
    30, // Radius of the shroom
    CELL_WIDTH, // Width (for scaling)
    CELL_HEIGHT, // Height (for scaling)
    `shroom_${row}_${col}` // Unique object ID
  );
  shrooms.push(shroom); // Add the shroom to the shrooms array
}

// Place the player character at the specified row and column
function placePlayer(row, col) {
  // Define player dimensions
  const playerWidth = 72; // Width of the player
  const playerHeight = 140; // Height of the player

  // Create player with defined properties
  player = defineNewDynamic(
    1.0, // Density
    0, // Friction
    0.1, // Restitution
    col * CELL_WIDTH + CELL_WIDTH / 2, // Centered X position
    row * CELL_HEIGHT + CELL_HEIGHT / 2, // Centered Y position
    playerWidth, // Width of the player
    playerHeight, // Height of the player
    "hero" // Object ID
  );

  // Prevent the player from rotating
  player.GetBody().IsFixedRotation = true; // Ensure player maintains upright position
}

// Main game loop function that updates the game state and renders the frame
function tick() {
  if (!paused) {
    // Check if the game is not paused
    const now = performance.now(); // Get the current time

    // Remove timestamps older than one second from the times array
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift(); // Remove the oldest timestamp
    }

    times.push(now); // Add the current timestamp to the array

    // Determine the frames per second (FPS) based on the number of timestamps
    if (times.length < 45) {
      fps = 30; // If less than 45 frames, set FPS to 30
    } else if (times.length < 75) {
      fps = 60; // If less than 75 frames, set FPS to 60
    } else if (times.length < 105) {
      fps = 90; // If less than 105 frames, set FPS to 90
    } else if (times.length < 130) {
      fps = 120; // If less than 130 frames, set FPS to 120
    } else if (times.length < 160) {
      fps = 144; // If less than 160 frames, set FPS to 144
    } else {
      fps = 280; // If 160 frames or more, set FPS to 280
    }

    // Update the HTML elements with the current FPS and score
    $("#fps").html("Framerate: " + fps); // Display the current FPS
    $("#score").html("Score: " + score); // Display the current score
    update(); // Call the update function to update game state
    stage.update(); // Update the stage to reflect changes
  }
}

// Update World Loop
function update() {
  // Step the Box2D world simulation
  world.Step(
    1 / 60, // Time step (1/60 seconds for 60 FPS)
    10, // Velocity iterations
    10 // Position iterations
  );

  // Update the hero's position based on the Box2D body position
  hero.x = player.GetBody().GetPosition().x * SCALE; // Update X position
  hero.y = player.GetBody().GetPosition().y * SCALE; // Update Y position

  // Update each shroom's position on the easel
  for (let i = 0; i < easelShrooms.length; i++) {
    easelShrooms[i].x = shrooms[i].GetBody().GetPosition().x * SCALE; // Update X position
    easelShrooms[i].y = shrooms[i].GetBody().GetPosition().y * SCALE; // Update Y position
  }

  // Draw debug data for the Box2D world (if enabled)
  world.DrawDebugData();

  // Clear forces in the Box2D world to prepare for the next step
  world.ClearForces();

  // Loop through the destroylist in reverse to avoid index issues
  for (let i = destroylist.length - 1; i >= 0; i--) {
    const body = destroylist[i]; // Get the physics body to destroy
    const id = body.GetUserData().id; // Get the user data ID of the body
    world.DestroyBody(body); // Destroy the physics body

    // Check if the destroyed body is a shroom
    if (id.includes("shroom")) {
      // Find the index of the corresponding shroom in the shrooms array
      const index = shrooms.findIndex((shroom) => shroom.GetBody() === body);

      // Remove the corresponding easelShroom from the stage
      if (easelShrooms[index]) {
        stage.removeChild(easelShrooms[index]); // Remove from the stage
        easelShrooms.splice(index, 1); // Remove from the easelShrooms array
        shrooms.splice(index, 1); // Optionally remove from shrooms array too
      } else {
        console.warn(`No easelShroom found at index: ${index}`); // Log a warning if not found
      }
    }
  }

  // Clear the destroylist for the next update
  destroylist.length = 0;
  stage.update(); // Update the stage to reflect changes
  followHero(); // Call followHero to update the camera/hero view
}

// Request the next animation frame to continue the update loop
window.requestAnimationFrame(update);

// Initialize the game
init();

// Keyboard Controls
const keydown = false;
$(document).keydown(function (e) {
  if (e.keyCode === 37) {
    goleft();
  }
  if (e.keyCode === 38) {
    goup();
  }
  if (e.keyCode === 39) {
    goright();
  }
  if (e.keyCode === 40) {
    godown();
  }
});

$(document).keyup(function (e) {
  if (e.keyCode === 37) {
    stopleftright();
  }
  if (e.keyCode === 39) {
    stopleftright();
  }
});

/*****
 * Listeners
 */
var listener = new Box2D.Dynamics.b2ContactListener();
// Begin contact listener for collision events
listener.BeginContact = function (contact) {
  const fixtureA = contact.GetFixtureA(); // Get the first fixture in the contact
  const fixtureB = contact.GetFixtureB(); // Get the second fixture in the contact

  const idA = fixtureA.GetBody().GetUserData().id; // Get the ID of the first body
  const idB = fixtureB.GetBody().GetUserData().id; // Get the ID of the second body

  let hasTriggered = false; // Flag to check if the event has already been triggered

  // Check if the hero collides with a pole
  if (idA === "hero" && idB.includes("pole") && !hasTriggered) {
    hasTriggered = true; // Set the flag to true to prevent re-triggering

    winSound.load(); // Load the win sound
    // Add event listeners for when the sound is ready or if there's an error
    winSound.addEventListener(
      "canplaythrough",
      () => {
        console.log("Sound is ready to play"); // Log when sound is ready
      },
      false
    );
    winSound.addEventListener(
      "error",
      () => {
        console.error("Error loading sound"); // Log if there's an error loading the sound
      },
      false
    );

    winSound.volume = 1; // Set the volume for the sound
    // Play the sound and handle any errors
    winSound.play().catch((error) => {
      console.error("Error playing sound:", error);
    });

    clearInterval(levelTimer); // Stop the level timer

    // Check if the current map level is less than 3
    if (parseInt(localStorage.getItem("map_level")) < 3) {
      // Increment the map level in localStorage
      localStorage.setItem(
        "map_level",
        parseInt(localStorage.getItem("map_level")) + 1
      );

      // Calculate score based on time spent
      if (timeSpent < 30) {
        score = score * 5; // High multiplier for quick completion
      } else if (timeSpent < 60) {
        score = score * 3; // Medium multiplier
      } else if (timeSpent < 90) {
        score = score * 2; // Lower multiplier
      } else if (timeSpent < 120) {
        score = score * 1.5; // Slight bonus
      } else if (timeSpent < 150) {
        score = score * 1.2; // Minimal bonus
      }

      // Update final score in localStorage
      let currentScore = parseInt(localStorage.getItem("final_score")) || 0;
      localStorage.setItem("final_score", currentScore + score);

      // Hide UI elements for the win screen
      document.getElementById("easelcan").style.display = "none";
      document.getElementById("back_btn").style.display = "none";
      document.getElementById("score").style.display = "none";
      document.getElementById("fps").style.display = "none";
      document.getElementById("map_win").style.display = "flex";

      // Display time and score on the win screen
      $("#time").html("You completed the level in: " + timeSpent + " seconds.");
      $("#lvl_score").html("Your score was: " + score);
    } else {
      // If map level is 3 or higher, show the game over screen
      document.getElementById("easelcan").style.display = "none";
      document.getElementById("back_btn").style.display = "none";
      document.getElementById("score").style.display = "none";
      document.getElementById("fps").style.display = "none";
      document.getElementById("game_over").style.display = "flex";

      // Display the final score
      const finalScore = parseInt(localStorage.getItem("final_score"));
      document.getElementById("final_score").innerHTML =
        "Your Final Score was: " + finalScore;

      // Submit the score to the server
      fetch("Highscore.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: username, // Player's username
          avatar: avatar, // Player's avatar
          score: finalScore, // Final score to submit
        }),
      })
        .then((response) => response.text())
        .then((result) => {
          console.log("Score submission response:", result); // Log server response
        })
        .catch((error) => {
          console.error("Error submitting score:", error); // Log submission error
        });
    }
  }

  // Check for collisions between hero and shrooms
  if (
    (idA === "hero" && idB.includes("shroom")) ||
    (idB.includes("shroom") && idA === "hero")
  ) {
    shroomSound.load(); // Load the shroom sound
    // Add event listeners for sound readiness and error
    shroomSound.addEventListener(
      "canplaythrough",
      () => {
        console.log("Sound is ready to play"); // Log when sound is ready
      },
      false
    );
    shroomSound.addEventListener(
      "error",
      () => {
        console.error("Error loading sound"); // Log if there's an error loading the sound
      },
      false
    );

    shroomSound.volume = 1; // Set the volume for the shroom sound
    // Play the sound and handle any errors
    shroomSound.play().catch((error) => {
      console.error("Error playing sound:", error);
    });

    // If the hero is involved in the collision with the shroom
    if (idA === "hero" || idB === "hero") {
      score += 10; // Increase score by 10 for collecting the shroom
      destroylist.push(contact.GetFixtureB().GetBody()); // Mark the shroom for destruction
    }
  }
};

listener.EndContact = function (contact) {};
listener.PostSolve = function (contact, impulse) {
  const fixa = contact.GetFixtureA().GetBody().GetUserData().id;
  const fixb = contact.GetFixtureB().GetBody().GetUserData().id;
};
listener.PreSolve = function (contact, oldManifold) {};
this.world.SetContactListener(listener);

// Functions
function goleft() {
  if (!keydown) {
    hero.gotoAndPlay("run");
    hero.scaleX = -1;
  }

  player
    .GetBody()
    .ApplyImpulse(new b2Vec2(-9, 0), player.GetBody().GetWorldCenter());
  if (player.GetBody().GetLinearVelocity().x < -10) {
    player
      .GetBody()
      .SetLinearVelocity(
        new b2Vec2(-10, player.GetBody().GetLinearVelocity().y)
      );
  }

  // player
  //   .GetBody()
  //   .SetLinearVelocity(new b2Vec2(-10, player.GetBody().GetLinearVelocity().y));
}

function goright() {
  if (!keydown) {
    hero.gotoAndPlay("run");
    hero.scaleX = 1;
  }

  player
    .GetBody()
    .ApplyImpulse(new b2Vec2(9, 0), player.GetBody().GetWorldCenter());
  if (player.GetBody().GetLinearVelocity().x > 10) {
    player
      .GetBody()
      .SetLinearVelocity(
        new b2Vec2(10, player.GetBody().GetLinearVelocity().y)
      );
  }

  // player
  //   .GetBody()
  //   .SetLinearVelocity(new b2Vec2(10, player.GetBody().GetLinearVelocity().y));
}

function goup() {
  // Check if player is on the ground
  if (player.GetBody().GetLinearVelocity().y === 0) {
    hero.gotoAndPlay("jump");

    player
      .GetBody()
      .SetLinearVelocity(
        new b2Vec2(player.GetBody().GetLinearVelocity().x, -20)
      );
  }
}

function godown() {
  hero.gotoAndPlay("drop");
  player
    .GetBody()
    .SetLinearVelocity(new b2Vec2(player.GetBody().GetLinearVelocity().x, 10));
}

function stopleftright() {
  hero.gotoAndPlay("stand");
  player
    .GetBody()
    .SetLinearVelocity(new b2Vec2(0, player.GetBody().GetLinearVelocity().y));
}

function defineNewStatic(
  density,
  friction,
  restitution,
  x,
  y,
  width,
  height,
  objid,
  angle
) {
  const fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  const bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.angle = angle;
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
  const thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj
    .GetBody()
    .SetUserData({ id: objid, x: x, y: y, width: width, height: height });
  return thisobj;
}

function defineNewDynamic(
  density,
  friction,
  restitution,
  x,
  y,
  width,
  height,
  objid
) {
  const fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  const bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.fixedRotation = true; // Set fixedRotation to true
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
  const thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj.GetBody().SetUserData({ id: objid });
  return thisobj;
}

function defineNewDynamicCircle(
  density,
  friction,
  restitution,
  x,
  y,
  r,
  width,
  height,
  objid
) {
  const fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  const bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.fixedRotation = true; // Set fixedRotation to true
  fixDef.shape = new b2CircleShape(r / SCALE);
  const body = world.CreateBody(bodyDef);
  const thisobj = body.CreateFixture(fixDef);

  body.SetBullet(true); // Ensure continuous collision detection
  body.SetUserData({ id: objid, x: x, y: y, width: width, height: height });

  return thisobj;
}

function makeBitmap(ldrimg, b2x, b2y) {
  const theimage = new createjs.Bitmap(ldrimg);
  const scalex = (b2x * 2) / theimage.image.naturalWidth;
  const scaley = (b2y * 2) / theimage.image.naturalHeight;
  theimage.scaleX = scalex;
  theimage.scaleY = scaley;
  theimage.regX = theimage.image.width / 2;
  theimage.regY = theimage.image.height / 2;
  return theimage;
}

function makeHorizontalTile(ldrimg, fillw, tilew) {
  const theimage = new createjs.Shape();
  theimage.graphics
    .beginBitmapFill(ldrimg)
    .drawRect(0, 0, fillw + ldrimg.width, ldrimg.height);
  theimage.tileW = tilew;
  theimage.snapToPixel = true;
  return theimage;
}

// Function to handle completion of asset loading
function handleComplete() {
  const groundimg = loader.getResult("ground"); // Get the ground image from the loader

  // Create the sky
  easelsky = makeBitmap(loader.getResult("sky"), stagewidth, stageheight); // Create a bitmap for the sky
  easelsky2 = makeBitmap(loader.getResult("sky"), stagewidth, stageheight); // Second sky layer for parallax effect

  // Set the position of the sky images
  easelsky.x = 0;
  easelsky2.x = stagewidth; // Position the second sky to the right of the first
  stage.addChild(easelsky, easelsky2); // Add the sky layers to the stage

  // Create the ground
  easelground = makeHorizontalTile(loader.getResult("ground"), WIDTH, 64); // Create a horizontal ground tile
  easelground.x = 0; // Set ground position
  easelground.y = HEIGHT - groundimg.height; // Position ground at the bottom of the canvas

  // Create platforms from Box2D bodies
  platforms.map((platform) => {
    const platformWidth = platform.GetBody().GetUserData().width; // Get width from Box2D body
    const platformHeight = platform.GetBody().GetUserData().height; // Get height from Box2D body

    // Create a visual representation of the platform
    const allPlatforms = makeHorizontalTile(
      loader.getResult("plat1"), // Load platform image
      platformWidth * 1.25, // Scale width for aesthetics
      platformHeight
    );

    // Get the Box2D platform's position and adjust for EaselJS alignment
    const platformBody = platform.GetBody().GetUserData();
    const platformX = platformBody.x - platformWidth; // Center alignment
    const platformY = platformBody.y - platformHeight; // Center alignment

    // Position the platform visual
    allPlatforms.x = platformX;
    allPlatforms.y = platformY;

    // Add the platform visual to the list
    easelPlatforms.push(allPlatforms);
  });

  // Create pipes from Box2D bodies
  pipes.map((pipe) => {
    const pipeimg = loader.getResult("pipe"); // Load pipe image

    const pipeWidth = pipeimg.width; // Get pipe width
    const pipeHeight = pipeimg.height; // Get pipe height

    // Create a visual representation of the pipe
    const pipeVisual = makeBitmap(pipeimg, pipeWidth, pipeHeight);

    // Get the Box2D pipe's position and adjust for EaselJS alignment
    const pipeBody = pipe.GetBody().GetUserData();
    const pipeX = pipeBody.x; // Direct alignment
    const pipeY = pipeBody.y + pipeimg.height / 15; // Adjust to fit visually

    // Position the pipe visual
    pipeVisual.x = pipeX;
    pipeVisual.y = pipeY;

    // Add the pipe visual to the list
    easelPipes.push(pipeVisual);
  });

  // Create shrooms from Box2D bodies
  shrooms.map((shroom) => {
    const shroomsimg = loader.getResult("shroom"); // Load shroom image

    const shroomsWidth = shroomsimg.width; // Get shroom width
    const shroomsHeight = shroomsimg.height; // Get shroom height

    // Create a visual representation of the shroom
    const shroomsVisual = makeBitmap(
      shroomsimg,
      shroomsWidth / 2, // Scale down width
      shroomsHeight / 2 // Scale down height
    );

    // Get the Box2D shroom's position and adjust for EaselJS alignment
    const shroomsBody = shroom.GetBody().GetUserData();
    const shroomsX = shroomsBody.x; // Direct alignment
    const shroomsY = shroomsBody.y + shroomsimg.height * 3.2; // Adjust to fit visually

    // Position the shroom visual
    shroomsVisual.x = shroomsX;
    shroomsVisual.y = shroomsY;

    // Add the shroom visual to the list
    easelShrooms.push(shroomsVisual);

    // Add all shroom visuals to the stage
    stage.addChild(...easelShrooms);
  });

  // Create the pole visual
  easelPole = makeBitmap(loader.getResult("pole"), 64, 128); // Load pole image and set dimensions
  easelPole.x = pole.GetBody().GetUserData().x; // Set X position from Box2D body
  easelPole.y = pole.GetBody().GetUserData().y - (groundimg.height + 3); // Set Y position below the ground

  // Create the hero sprite
  const spritesheet = new createjs.SpriteSheet({
    framerate: 60, // Set framerate for animations
    images: [loader.getResult("hero")], // Load hero image
    frames: {
      regX: 82,
      regY: 144,
      width: 165,
      height: 292,
      count: 64, // Total number of frames in the sprite sheet
    },
    animations: {
      stand: [56, 57, "stand", 1], // Animation definitions
      run: [0, 34, "run", 1.5],
      jump: [26, 63, "stand", 1],
      drop: [49, 57, "stand", 1],
    },
  });

  // Create the hero sprite instance
  hero = new createjs.Sprite(spritesheet, "stand"); // Start with the "stand" animation
  hero.snapToPixel = true; // Align the sprite to pixel grid

  // Add all visual elements to the stage
  stage.addChild(
    easelground, // Add ground
    ...easelPipes, // Add all pipes
    easealhill1, // Add first hill
    easealhill2, // Add second hill
    hero, // Add hero
    ...easelPlatforms, // Add all platforms
    easelShroom, // Add shrooms
    easelPole // Add pole
  );

  // Set up the ticker for animations
  createjs.Ticker.framerate = 60; // Set the ticker to 60 fps
  createjs.Ticker.timingMode = createjs.Ticker.RAF; // Use requestAnimationFrame for timing
  createjs.Ticker.addEventListener("tick", tick); // Add the tick function for updating the stage
}

// Function to initialize the game
function init() {
  easelCan = document.getElementById("easelcan"); // Get the canvas element
  easelctx = easelCan.getContext("2d"); // Get the 2D rendering context
  stage = new createjs.Stage(easelCan); // Create a new EaselJS stage
  stage.snapPixelsEnabled = true; // Enable pixel snapping for better rendering
  stagewidth = WIDTH; // Set the stage width
  stageheight = stage.canvas.height; // Set the stage height

  // Manifest of assets to load
  const manifest = [
    { src: "hero.png", id: "hero" },
    { src: "ground.png", id: "ground" },
    { src: "sky.png", id: "sky" },
    { src: "hill1.png", id: "hill1" },
    { src: "hill2.png", id: "hill2" },
    { src: "platform.png", id: "plat1" },
    { src: "pipe.png", id: "pipe" },
    { src: "shroom.png", id: "shroom" },
    { src: "pole.png", id: "pole" },
  ];

  // Create a new loader for assets
  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete); // Add event listener for when loading completes
  loader.loadManifest(manifest, true, "./assets/"); // Load the asset manifest
}

// VIEWPORT
let initialised = false;
let animationcomplete = false;

// Function to adjust the camera to follow the hero (player)
function followHero() {
  // Get the player's current position in the world, scaled to canvas size
  const playerPosX = player.GetBody().GetPosition().x * SCALE; // Scale X position
  const playerPosY = player.GetBody().GetPosition().y * SCALE; // Scale Y position

  // Get the dimensions of the viewport (canvas)
  const viewportWidth = stage.canvas.width; // Width of the canvas
  const viewportHeight = stage.canvas.height; // Height of the canvas

  // Calculate camera offsets to keep the player centered in the viewport
  const offsetX = viewportWidth / 2 - playerPosX; // Horizontal offset
  const offsetY = viewportHeight / 2 - playerPosY; // Vertical offset

  // Set boundaries for the camera to avoid moving beyond the world limits
  const minOffsetX = -WIDTH + viewportWidth; // Minimum X offset (left boundary)
  const maxOffsetX = 0; // Maximum X offset (right boundary)
  const minOffsetY = -HEIGHT + viewportHeight; // Minimum Y offset (top boundary)
  const maxOffsetY = 0; // Maximum Y offset (bottom boundary)

  // Clamp the calculated camera position within the world limits
  const finalOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX)); // Final X offset within bounds
  const finalOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY)); // Final Y offset within bounds

  // Apply the camera translation to the stage to keep the player centered
  stage.x = finalOffsetX; // Set the X position of the stage
  stage.y = finalOffsetY; // Set the Y position of the stage
}
