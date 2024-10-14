"use strict";

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

// Define the world
var WIDTH = 1200;
var HEIGHT = 800;
var SCALE = 30;

// Constants for grid dimensions
const CELL_WIDTH = 50; // Width of each cell
const CELL_HEIGHT = 50; // Height of each cell
const ROWS = Math.floor(HEIGHT / CELL_HEIGHT); // Calculate number of rows
const COLS = Math.floor(WIDTH / CELL_WIDTH); // Calculate number of columns

var world = new b2World(new b2Vec2(0, 9.81), true);
// Objects for destruction
var destroylist = [];

var player;
var easelCan, easelctx, loader, stage, stagewidth, stageheight;

var easelground, easealsky, easealhill1, easealhill2, hero;
var platforms = [];
var easelPlatforms = [];

// Load the map
fetch("./assets/map.txt") // Assuming your map.txt is in the 'assets' folder
  .then((response) => response.text())
  .then((data) => processMap(data)) // Process the map data
  .catch((error) => console.error("Error loading map:", error));

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
        }
      }
    }
  });
}

function createGround(row, col) {
  const positionX = col * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = HEIGHT - CELL_HEIGHT / 2; // Centered Y position for ground

  // Create ground object
  return defineNewStatic(
    1.0, // density
    0, // friction
    0.2, // restitution
    positionX, // X position
    positionY, // Y position
    CELL_WIDTH, // width
    CELL_HEIGHT, // height
    "ground" + row + "_" + col, // Unique ID, to avoid duplicates
    0
  );
}

function createPlatforms(row, colStart, colEnd) {
  // Define platform dimensions
  const platformHeight = 24;
  const platformWidth = (colEnd - colStart + 1) * CELL_WIDTH; // Width based on the number of columns

  const positionX = ((colStart + colEnd) / 2) * CELL_WIDTH + CELL_WIDTH / 2; // Centered X position
  const positionY = row * CELL_HEIGHT + platformHeight / 2; // Centered Y position for platform

  // Create platform object
  const platform = defineNewStatic(
    1.0, // density
    0.5, // friction
    0.2, // restitution
    positionX, // X position
    positionY, // Y position
    platformWidth, // width
    platformHeight, // height
    "plat" + row + "_" + colStart + "_" + colEnd, // Unique ID
    0 // angle
  );

  platforms.push(platform);
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
  return player;
}

function tick() {
  update();
  stage.update();
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

  world.DrawDebugData();

  world.ClearForces();
  for (var i in destroylist) {
    world.DestroyBody(destroylist[i]);
  }
  destroylist.length = 0;
  followHero();
}
// window.requestAnimationFrame(update);

init();

// Mushrooms
// var mycircle = defineNewDynamicCircle(1.0, 0.2, 0.1, 400, 250, 30, "acircle");
// var mycircle2 = defineNewDynamicCircle(1.0, 0.2, 0.1, 385, 140, 30, "bcircle");

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
  console.log("Begin Contact:" + contact.GetFixtureA().GetBody().GetUserData());
};
listener.EndContact = function (contact) {
  console.log("End Contact:" + contact.GetFixtureA().GetBody().GetUserData());
};
listener.PostSolve = function (contact, impulse) {
  const fixa = contact.GetFixtureA().GetBody().GetUserData().id;
  const fixb = contact.GetFixtureB().GetBody().GetUserData().id;
  console.log(
    fixa + " hits " + fixb + " with imp:" + impulse.normalImpulses[0]
  );

  if (
    (fixa === "hero" && fixb === "acircle") ||
    (fixa === "hero" && fixb === "bcircle")
  ) {
    destroylist = destroylist.concat([contact.GetFixtureB().GetBody()]);
  }
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
  objidconst
) {
  const fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  const bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  fixDef.shape = new b2CircleShape(r / SCALE);
  const thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj.GetBody().SetUserData({ id: objid });
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
  easealsky = makeBitmap(loader.getResult("sky"), stagewidth, stageheight);
  easealsky.x = 0;
  easealsky.y = 0;

  // Create the hills
  const hill1img = loader.getResult("hill1");
  easealhill1 = makeBitmap(
    loader.getResult("hill1"),
    hill1img.width,
    hill1img.height
  );
  easealhill1.x = Math.random() * stagewidth;
  easealhill1.y = HEIGHT - easealhill1.image.height - groundimg.height;

  const hill2img = loader.getResult("hill2");
  easealhill2 = makeBitmap(
    loader.getResult("hill2"),
    hill2img.width,
    hill2img.height
  );
  easealhill2.x = Math.random() * stagewidth;
  easealhill2.y = HEIGHT - easealhill2.image.height - groundimg.height;

  // Create the ground
  easelground = makeHorizontalTile(loader.getResult("ground"), stagewidth, 64);
  easelground.x = 0;
  easelground.y = HEIGHT - groundimg.height;

  platforms.map((platform) => {
    console.log(platform.GetBody().GetUserData());
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
    easealsky,
    easelground,
    easealhill1,
    easealhill2,
    hero,
    ...easelPlatforms
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
  stagewidth = stage.canvas.width;
  stageheight = stage.canvas.height;
  const manifest = [
    { src: "hero.png", id: "hero" },
    { src: "ground.png", id: "ground" },
    { src: "sky.png", id: "sky" },
    { src: "hill1.png", id: "hill1" },
    { src: "hill2.png", id: "hill2" },
    { src: "platform.png", id: "plat1" },
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
  if (!initialised && !animationcomplete) {
    // Update condition to allow initial run
    $("#easelcan").css({
      transform: "scale(0.8)",
      top: "-210px",
      left: "-400px",
    });
    initialised = true;
    $("#easelcan").animate(
      {
        top: -400,
        left: 0,
        easing: "swing",
      },
      {
        duration: 3000,
        start: function () {
          $("#easelcan").css({
            transform: "scale(1)",
            transition: "transform 3000ms",
          });
        },
        complete: function () {
          animationcomplete = true;
        },
      }
    );
  }
  if (animationcomplete && initialised) {
    var zoompadding = 100;
    var VP = Object.create({});
    VP.width = $("viewport").width();
    VP.height = $("viewport").height();
    VP.left = parseInt($("#easelcan").css("left"));
    VP.top = parseInt($("#easelcan").css("top"));
    var AW = Object.create({});
    AW.leftpad = 100;
    AW.rightpad = 200;
    AW.toppad = 150;
    AW.bottompad = 200;
    var leftlimitmax = WIDTH - VP.width - zoompadding;
    var leftlimitmin = zoompadding;
    var toplimitmax = HEIGHT - VP.height - zoompadding;
    var toplimitmin = zoompadding;
    var leftposition = 0;
    var topposition = 0;

    var heroposx = player.GetBody().GetPosition().x * SCALE;
    var ltr = player.GetBody().GetLinearVelocity().x >= 0 ? true : false;

    if (heroposx >= VP.left + (VP.width - AW.rightpad) && ltr) {
      leftposition = heroposx + AW.rightpad - VP.width;
    } else if (heroposx <= -VP.left + AW.leftpad) {
      leftposition = heroposx - AW.leftpad;
    } else {
      leftposition = -VP.left;
    }

    if (leftposition < leftlimitmin) {
      leftposition = leftlimitmin;
    } else if (leftposition > leftlimitmax) {
      leftposition = leftlimitmax;
    }

    $("#easelcan").css({ left: 0, transition: "left 34ms" });

    var heroposy = player.GetBody().GetPosition().y * SCALE;

    if (heroposy >= VP.top + (VP.height - AW.rightpad)) {
      topposition = heroposy + AW.bottompad - VP.height;
    } else if (heroposy <= -VP.top + AW.toppad) {
      topposition = heroposy - AW.toppad;
    } else {
      topposition = -VP.top;
    }

    if (topposition < toplimitmin) {
      topposition = toplimitmin;
    }
    if (topposition > toplimitmax) {
      topposition = toplimitmax;
    }

    $("#easelcan").css({ toppad: -topposition, transition: "left 34ms" });

    var herovelocity = Math.abs(player.GetBody().GetLinearVelocity().x) / 10;

    console.log(herovelocity);

    var scale =
      herovelocity < 0.8 && herovelocity > 0.1
        ? 1.1
        : herovelocity > 1.1
        ? 0.8
        : 1;

    $("#easelcan").css({
      transform: "scale(" + scale + ")",
      transition: "transform 3000ms",
    });
  }
}
