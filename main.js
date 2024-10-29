"use strict";

function loadMap(mapFilePath) {
  console.log("Loading map:", mapFilePath);
  fetch(mapFilePath) // Load the specified map file
    .then((response) => response.text())
    .then((data) => {
      processMap(data); // Process the new map data
    })
    .catch((error) => console.error("Error loading map:", error));
}

if (!mapComplete) {
  loadMap("./assets/map.txt"); // Load the initial map
}

// Process the map content
function processMap(data) {
  const lines = data.split("\n"); // Split content into lines

  lines.forEach((line, rowIndex) => {
    let colStart = -1; // Track the start of a platform

    for (let colIndex = 0; colIndex < line.length; colIndex++) {
      const char = line[colIndex];

      if (char === "%") {
        // If this is the start of a platform, mark the start
        if (colStart === -1) {
          colStart = colIndex;
        }
      } else if (char === "&") {
        createPipe(rowIndex, colIndex);
      } else if (char === "$") {
        createShroom(rowIndex, colIndex);
      } else if (char === "*") {
        createEndPole(rowIndex, colIndex);
      } else {
        // If we reach the end of a platform, create it
        if (colStart !== -1) {
          createPlatforms(rowIndex, colStart, colIndex - 1); // Pass start and end columns
          colStart = -1; // Reset the start
        }

        // Process other characters
        if (char === "P") {
          // Place player
          placePlayer(rowIndex, colIndex);
        } else if (char === "#") {
          // Create ground
          createGround(rowIndex, colIndex);
          groundTotal += colIndex;
        }
      }
    }
  });
}

function clearCurrentMap(mapFilePath) {
  // Clear Box2D world
  let body = world.GetBodyList();
  while (body) {
    let nextBody = body.GetNext();
    world.DestroyBody(body);
    body = nextBody;
  }

  // Reinitialize Box2D world
  world = new b2World(new b2Vec2(0, 9.81), false);

  // Clear arrays holding game objects
  destroylist = [];
  pole = null;
  player = null;

  // Clear EaselJS objects from stage and reset arrays
  for (let i = easelPlatforms.length - 1; i >= 0; i--) {
    stage.removeChild(easelPlatforms[i]);
  }
  platforms = [];
  easelPlatforms = [];

  for (let i = easelPipes.length - 1; i >= 0; i--) {
    stage.removeChild(easelPipes[i]);
  }
  pipes = [];
  easelPipes = [];

  for (let i = easelShrooms.length - 1; i >= 0; i--) {
    stage.removeChild(easelShrooms[i]);
  }
  shrooms = [];
  easelShrooms = [];

  // Reset ground total if needed
  groundTotal = 0;

  // Update stage to reflect the cleared state
  stage.update();

  // Load new map if a path is provided
  if (mapFilePath) {
    loadMap(mapFilePath);
  }
}

// BOX2DWEB Definitions
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

var mapComplete = false;
var groundTotal = 0;

// Define the world
var WIDTH = 40000;
var HEIGHT = 800;
var SCALE = 30;

// Constants for grid dimensions
const CELL_WIDTH = 50; // Width of each cell
const CELL_HEIGHT = 50; // Height of each cell
const ROWS = Math.floor(HEIGHT / CELL_HEIGHT); // Calculate number of rows
const COLS = Math.floor(WIDTH / CELL_WIDTH); // Calculate number of columns

var world = new b2World(new b2Vec2(0, 9.81), false);
// Objects for destruction
var destroylist = [];
const times = [];
let fps;

var player;
var easelCan, easelctx, loader, stage, stagewidth, stageheight;

var easelground,
  easelsky,
  easelsky2,
  easelhill,
  easealhill1,
  easealhill2,
  hero,
  easelShroom;

var pole;
var platforms = [];
var easelPlatforms = [];
var pipes = [];
var easelPipes = [];
var shrooms = [];
var easelShrooms = [];

// Create the ground
function createGround(row, col) {
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2;
  const positionY = HEIGHT - CELL_HEIGHT / 2;
  return defineNewStatic(
    1.0,
    0,
    0.2,
    positionX,
    positionY,
    CELL_WIDTH,
    CELL_HEIGHT,
    `ground_${row}_${col}`,
    0
  );
}

function createPlatforms(row, colStart, colEnd) {
  const platformHeight = 24;
  const platformWidth = (colEnd - colStart + 1) * CELL_WIDTH;
  const positionX = ((colStart + colEnd + 1) / 2) * CELL_WIDTH;
  const positionY = row * CELL_HEIGHT + platformHeight / 2;

  const platform = defineNewStatic(
    1.0,
    0.5,
    0.2,
    positionX,
    positionY,
    platformWidth,
    platformHeight,
    `plat${row}_${colStart}_${colEnd}`,
    0
  );
  platforms.push(platform);
}

function createEndPole(row, col) {
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2;
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT * 5.5;

  pole = defineNewStatic(
    1.0,
    0,
    0.2,
    positionX,
    positionY,
    CELL_WIDTH,
    CELL_HEIGHT,
    `pole_${row}_${col}`,
    0
  );
}

function createPipe(row, col) {
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2;
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT * 5.5;

  const pipe = defineNewStatic(
    1.0,
    0,
    0.2,
    positionX,
    positionY,
    CELL_WIDTH,
    CELL_HEIGHT,
    `pipe_${row}_${col}`,
    0
  );
  pipes.push(pipe);
}

function createShroom(row, col) {
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2;
  const positionY = row * CELL_HEIGHT + CELL_HEIGHT / 2;

  const shroom = defineNewDynamicCircle(
    1.0,
    0.2,
    0.1,
    positionX,
    positionY,
    30,
    CELL_WIDTH,
    CELL_HEIGHT,
    `shroom_${row}_${col}`
  );
  shrooms.push(shroom);
}

function placePlayer(row, col) {
  // Define player dimensions
  const playerWidth = 72;
  const playerHeight = 140;

  // Create player
  player = defineNewDynamic(
    1.0, // density
    0, // friction
    0.1, // restitution
    col * CELL_WIDTH + CELL_WIDTH / 2, // Centered X position
    row * CELL_HEIGHT + CELL_HEIGHT / 2, // Centered Y position
    playerWidth, // width
    playerHeight, // height
    "hero" // object ID
  );

  player.GetBody().IsFixedRotation = true; // Prevent rotation
}

function tick() {
  if (!paused) {
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
      times.shift();
    }
    times.push(now);

    if (times.length < 45) {
      fps = 30;
    } else if (times.length < 75) {
      fps = 60;
    } else if (times.length < 105) {
      fps = 90;
    } else if (times.length < 130) {
      fps = 120;
    } else if (times.length < 160) {
      fps = 144;
    } else {
      fps = 280;
    }

    $("#fps").html("Framerate: " + fps);
    update();
    stage.update();
  }
}

// Update World Loop
function update() {
  world.Step(
    1 / 60, // framerate
    10, // velocity iterations
    10 // position iterations
  );

  hero.x = player.GetBody().GetPosition().x * SCALE;
  hero.y = player.GetBody().GetPosition().y * SCALE;

  for (let i = 0; i < easelShrooms.length; i++) {
    easelShrooms[i].x = shrooms[i].GetBody().GetPosition().x * SCALE;
    easelShrooms[i].y = shrooms[i].GetBody().GetPosition().y * SCALE;
  }

  world.DrawDebugData();

  world.ClearForces();

  // Loop through destroylist in reverse
  for (let i = destroylist.length - 1; i >= 0; i--) {
    const body = destroylist[i];
    const id = body.GetUserData().id;
    world.DestroyBody(body); // Destroy the physics body

    // Check if it is a shroom
    if (id.includes("shroom")) {
      // Find the corresponding index
      const index = shrooms.findIndex((shroom) => shroom.GetBody() === body);

      // Remove corresponding easelShroom from the stage
      if (easelShrooms[index]) {
        stage.removeChild(easelShrooms[index]); // Remove from stage
        easelShrooms.splice(index, 1); // Remove from easelShrooms array
        shrooms.splice(index, 1); // Optionally remove from shrooms array too
      } else {
        console.warn(`No easelShroom found at index: ${index}`); // Debugging log
      }
    }
  }

  destroylist.length = 0;
  stage.update(); // Update the stage to reflect changes
  followHero();
}
window.requestAnimationFrame(update);

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
listener.BeginContact = function (contact) {
  const fixtureA = contact.GetFixtureA();
  const fixtureB = contact.GetFixtureB();

  const idA = fixtureA.GetBody().GetUserData().id;
  const idB = fixtureB.GetBody().GetUserData().id;

  // Get the positions of both bodies
  const bodyA = fixtureA.GetBody();
  const bodyB = fixtureB.GetBody();

  const positionA = bodyA.GetPosition();
  const positionB = bodyB.GetPosition();

  if (idA === "hero" && idB.includes("pole")) {
    console.log("Map Done");
    mapComplete = true;
    clearCurrentMap("./assets/map2.txt");
  }

  // Detect if one object is "shroom" and the other is "hero"
  if (
    (idA === "hero" && idB.includes("shroom")) ||
    (idB.includes("shroom") && idB === "hero")
  ) {
    // Determine if the contact is from above
    if (idA === "hero") {
      // Check if hero is above shroom
      if (positionA.y < positionB.y + 3) {
        // Destroy shroom
        destroylist.push(contact.GetFixtureB().GetBody());
      }
    } else {
      // Check if hero is above shroom
      if (positionB.y < positionA.y + 3) {
        // Destroy shroom
        destroylist.push(contact.GetFixtureA().GetBody());
      }
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
        new b2Vec2(player.GetBody().GetLinearVelocity().x, -40)
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

function handleComplete() {
  const groundimg = loader.getResult("ground");

  // Create the sky
  easelsky = makeBitmap(loader.getResult("sky"), stagewidth, stageheight);
  easelsky2 = makeBitmap(loader.getResult("sky"), stagewidth, stageheight);

  easelsky.x = 0;
  easelsky2.x = stagewidth;
  stage.addChild(easelsky, easelsky2);

  // Create the ground
  easelground = makeHorizontalTile(loader.getResult("ground"), WIDTH, 64);
  easelground.x = 0;
  easelground.y = HEIGHT - groundimg.height;

  platforms.map((platform) => {
    const platformWidth = platform.GetBody().GetUserData().width; // Define your platform width (same as in Box2D)
    const platformHeight = platform.GetBody().GetUserData().height; // Define your platform height (same as in Box2D)

    // Create a new platform visual
    const allPlatforms = makeHorizontalTile(
      loader.getResult("plat1"),
      platformWidth * 1.25,
      platformHeight
    );

    // Get Box2D platform's position (centered in Box2D)
    const platformBody = platform.GetBody().GetUserData();
    const platformX = platformBody.x - platformWidth; // Adjust for EaselJS (top-left alignment)
    const platformY = platformBody.y - platformHeight; // Adjust for EaselJS (top-left alignment)

    // Position the EaselJS platform
    allPlatforms.x = platformX;
    allPlatforms.y = platformY;

    // Add platform to the list
    easelPlatforms.push(allPlatforms);
  });

  // Create the pipes
  pipes.map((pipe) => {
    const pipeimg = loader.getResult("pipe");

    const pipeWidth = pipeimg.width; // Define your platform width (same as in Box2D)
    const pipeHeight = pipeimg.height; // Define your platform height (same as in Box2D)

    // Create a new pipe visual
    const pipeVisual = makeBitmap(pipeimg, pipeWidth, pipeHeight);

    // Get Box2D platform's position (centered in Box2D)
    const pipeBody = pipe.GetBody().GetUserData();
    const pipeX = pipeBody.x; // Adjust for EaselJS (top-left alignment)
    const pipeY = pipeBody.y + pipeimg.height / 15; // Adjust for EaselJS (top-left alignment)

    // Position the EaselJS platform
    pipeVisual.x = pipeX;
    pipeVisual.y = pipeY;

    // Add platform to the list
    easelPipes.push(pipeVisual);
  });

  // Create the shrooms
  shrooms.map((shroom) => {
    console.log(shroom);
    const shroomsimg = loader.getResult("shroom");

    const shroomsWidth = shroomsimg.width; // Define your platform width (same as in Box2D)
    const shroomsHeight = shroomsimg.height; // Define your platform height (same as in Box2D)

    // Create a new shrooms visual
    const shroomsVisual = makeBitmap(
      shroomsimg,
      shroomsWidth / 2,
      shroomsHeight / 2
    );

    console.log(shroomsVisual);

    // Get Box2D platform's position (centered in Box2D)
    const shroomsBody = shroom.GetBody().GetUserData();
    const shroomsX = shroomsBody.x; // Adjust for EaselJS (top-left alignment)
    const shroomsY = shroomsBody.y + shroomsimg.height * 3.2; // Adjust for EaselJS (top-left alignment)

    // Position the EaselJS platform
    shroomsVisual.x = shroomsX;
    shroomsVisual.y = shroomsY;

    // Add platform to the list
    easelShrooms.push(shroomsVisual);

    stage.addChild(...easelShrooms);
  });

  // Create the hero
  const spritesheet = new createjs.SpriteSheet({
    framerate: 60,
    images: [loader.getResult("hero")],
    frames: {
      regX: 82,
      regY: 144,
      width: 165,
      height: 292,
      count: 64,
    },
    animations: {
      stand: [56, 57, "stand", 1],
      run: [0, 34, "run", 1.5],
      jump: [26, 63, "stand", 1],
      drop: [49, 57, "stand", 1],
    },
  });

  hero = new createjs.Sprite(spritesheet, "stand");
  hero.snapToPixel = true;

  stage.addChild(
    easelground,
    ...easelPipes,
    easealhill1,
    easealhill2,
    hero,
    ...easelPlatforms,
    easelShroom
  );

  createjs.Ticker.framerate = 60;
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener("tick", tick);
}

function init() {
  easelCan = document.getElementById("easelcan");
  easelctx = easelCan.getContext("2d");
  stage = new createjs.Stage(easelCan);
  stage.snapPixelsEnabled = true;
  stagewidth = WIDTH;
  stageheight = stage.canvas.height;

  const manifest = [
    { src: "hero.png", id: "hero" },
    { src: "ground.png", id: "ground" },
    { src: "sky.png", id: "sky" },
    { src: "hill1.png", id: "hill1" },
    { src: "hill2.png", id: "hill2" },
    { src: "platform.png", id: "plat1" },
    { src: "pipe.png", id: "pipe" },
    { src: "shroom.png", id: "shroom" },
  ];

  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", handleComplete);
  loader.loadManifest(manifest, true, "./assets/");

  /*
  Debug Draw
  */
  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(document.getElementById("b2dcan").getContext("2d"));
  debugDraw.SetDrawScale(SCALE);
  debugDraw.SetFillAlpha(0.3);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  world.SetDebugDraw(debugDraw);
}

// VIEWPORT
let initialised = false;
let animationcomplete = false;

function followHero() {
  const playerPosX = player.GetBody().GetPosition().x * SCALE;
  const playerPosY = player.GetBody().GetPosition().y * SCALE;

  const viewportWidth = stage.canvas.width;
  const viewportHeight = stage.canvas.height;

  // Calculate camera offsets to keep player centered
  const offsetX = viewportWidth / 2 - playerPosX;
  const offsetY = viewportHeight / 2 - playerPosY;

  // Set boundaries for the camera to avoid moving beyond the world
  const minOffsetX = -WIDTH + viewportWidth;
  const maxOffsetX = 0;
  const minOffsetY = -HEIGHT + viewportHeight;
  const maxOffsetY = 0;

  // Clamp the camera position within the world limits
  const finalOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, offsetX));
  const finalOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, offsetY));

  // Apply the camera translation
  stage.x = finalOffsetX;
  stage.y = finalOffsetY;
}
