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

var world = new b2World(new b2Vec2(0, 9.81), true);

var easelCan, easelctx, loader, stage, stagewidth, stageheight;

var easelground, easealsky, easealhill1, easealhill2, hero, easelplat1;

// Ground
var ground = defineNewStatic(
  1.0, // density
  0, // friction
  0.2, // restitution
  WIDTH / 2, // X position
  HEIGHT, // Y position
  WIDTH / 2, // width
  80, // height
  "ground", // object ID
  0
);

// Player
var player = defineNewDynamic(
  1.0, // density
  0, // friction
  0.1, // restitution
  70, // X position
  200, // Y position
  72, // width
  140, // height
  "hero" // object ID
);
player.GetBody().IsFixedRotation = true;

// Platforms
var plat1 = defineNewStatic(
  1.0, // density
  0, // friction
  0.2, // restitution
  200, // X position
  250, // Y position
  100, // width
  20, // height
  "plat1", // object ID
  0
);

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

  // followHero();
  world.DrawDebugData();
  world.ClearForces();
  for (var i in destroylist) {
    world.DestroyBody(destroylist[i]);
  }
  destroylist.length = 0;
  //   window.requestAnimationFrame(update);
}

init();

// Objects for destruction
var destroylist = [];

// Mushrooms
// var mycircle = defineNewDynamicCircle(1.0, 0.2, 0.1, 400, 250, 30, "acircle");
// var mycircle2 = defineNewDynamicCircle(1.0, 0.2, 0.1, 385, 140, 30, "bcircle");

// Keyboard Controls
var keydown = false;
$(document).keydown(function (e) {
    if(e.keyCode == 37) {
      goleft();
    }
    if(e.keyCode == 38) {
      goup();
    }
    if(e.keyCode == 39) {
      goright();
    }
    if(e.keyCode == 40) {
      godown();
    }
});

$(document).keyup(function (e) {
  if(e.keyCode == 37) {
    stopleftright();
  }
  if(e.keyCode == 39) {
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
  var fixa = contact.GetFixtureA().GetBody().GetUserData().id;
  var fixb = contact.GetFixtureB().GetBody().GetUserData().id;
  console.log(
    fixa + " hits " + fixb + " with imp:" + impulse.normalImpulses[0]
  );

  if (
    (fixa == "hero" && fixb == "acircle") ||
    (fixa == "hero" && fixb == "bcircle")
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

  player.GetBody().ApplyImpulse(new b2Vec2(-9, 0), player.GetBody().GetWorldCenter());
  if (player.GetBody().GetLinearVelocity().x < -10) {
    player.GetBody().SetLinearVelocity(new b2Vec2(-10, player.GetBody().GetLinearVelocity().y));
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

  player.GetBody().ApplyImpulse(new b2Vec2(9, 0), player.GetBody().GetWorldCenter());
  if (player.GetBody().GetLinearVelocity().x > 10) {
    player.GetBody().SetLinearVelocity(new b2Vec2(10, player.GetBody().GetLinearVelocity().y));
  }

  // player
  //   .GetBody()
  //   .SetLinearVelocity(new b2Vec2(10, player.GetBody().GetLinearVelocity().y));
}

function goup() {
  // Check if player is on the ground
  if (player.GetBody().GetLinearVelocity().y === 0) {
    hero.gotoAndPlay("jump");

    player.GetBody().SetLinearVelocity(new b2Vec2(player.GetBody().GetLinearVelocity().x, -40));
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
  player.GetBody().SetLinearVelocity(new b2Vec2(0, player.GetBody().GetLinearVelocity().y));
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
  var fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.angle = angle;
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
  var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj.GetBody().SetUserData({ id: objid });
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
  var fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  bodyDef.fixedRotation = true; // Set fixedRotation to true
  fixDef.shape = new b2PolygonShape();
  fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
  var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
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
  objid
) {
  var fixDef = new b2FixtureDef();
  fixDef.density = density;
  fixDef.friction = friction;
  fixDef.restitution = restitution;
  var bodyDef = new b2BodyDef();
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.position.x = x / SCALE;
  bodyDef.position.y = y / SCALE;
  fixDef.shape = new b2CircleShape(r / SCALE);
  var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
  thisobj.GetBody().SetUserData({ id: objid });
  return thisobj;
}

function makeBitmap(ldrimg, b2x, b2y) {
  var theimage = new createjs.Bitmap(ldrimg);
  var scalex = (b2x * 2) / theimage.image.naturalWidth;
  var scaley = (b2y * 2) / theimage.image.naturalHeight;
  theimage.scaleX = scalex;
  theimage.scaleY = scaley;
  theimage.regX = theimage.image.width / 2;
  theimage.regY = theimage.image.height / 2;
  return theimage;
}

function makeHorizontalTile(ldrimg, fillw, tilew) {
  var theimage = new createjs.Shape();
  theimage.graphics
    .beginBitmapFill(ldrimg)
    .drawRect(0, 0, fillw + ldrimg.width, ldrimg.height);
  theimage.tileW = tilew;
  theimage.snapToPixel = true;
  return theimage;
}

function handleComplete() {
  var groundimg = loader.getResult("ground");

  // Create the sky
  easealsky = makeBitmap(loader.getResult("sky"), stagewidth, stageheight);
  easealsky.x = 0;
  easealsky.y = 0;

  // Create the hills
  var hill1img = loader.getResult("hill1");
  easealhill1 = makeBitmap(
    loader.getResult("hill1"),
    hill1img.width,
    hill1img.height
  );
  easealhill1.x = Math.random() * stagewidth;
  easealhill1.y = HEIGHT - easealhill1.image.height - groundimg.height;

  var hill2img = loader.getResult("hill2");
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

  // Create the platform
  easelplat1 = makeHorizontalTile(loader.getResult("plat1"), 500, 64);
  easelplat1.x = 200;
  easelplat1.y = 400;

  // Create the hero
  var spritesheet = new createjs.SpriteSheet({
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
      run: [0, 34, "run", 1],
      jump: [26, 63, "stand", 1],
      drop: [49, 57, "stand", 1],
    },
  });

  hero = new createjs.Sprite(spritesheet, "stand");
  hero.snapToPixel = true;


  stage.addChild(easealsky, easelground, easealhill1, easealhill2, hero, easelplat1);
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
  var manifest = [
    { src: "hero.png", id: "hero" },
    { src: "ground.png", id: "ground" },
    { src: "sky.png", id: "sky" },
    { src: "hill1.png", id: "hill1" },
    { src: "hill2.png", id: "hill2" },
    { src: "ground.png", id: "plat1" },
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
// var initialised = false;
// var animationcomplete = false;

// function followHero() {
//   if (!initialised && !animationcomplete) {
//     // Update condition to allow initial run
//     $("#easelcan").css({
//       transform: "scale(0.8)",
//       top: "-210px",
//       left: "-400px",
//     });
//     initialised = true;
//     $("#easelcan").animate(
//       {
//         top: -400,
//         left: 0,
//         easing: "swing",
//       },
//       {
//         duration: 3000,
//         start: function () {
//           $("#easelcan").css({
//             transform: "scale(1)",
//             transition: "transform 3000ms",
//           });
//         },
//         complete: function () {
//           animationcomplete = true;
//         },
//       }
//     );
//   }
//   if (animationcomplete && initialised) {
//     var zoompadding = 100;
//     var VP = Object.create({});
//     VP.width = $("viewport").width();
//     VP.height = $("viewport").height();
//     VP.left = parseInt($("#easelcan").css("left"));
//     VP.top = parseInt($("#easelcan").css("top"));
//     var AW = Object.create({});
//     AW.leftpad = 100;
//     AW.rightpad = 200;
//     AW.toppad = 150;
//     AW.bottompad = 200;
//     var leftlimitmax = WIDTH - VP.width - zoompadding;
//     var leftlimitmin = zoompadding;
//     var toplimitmax = HEIGHT - VP.height - zoompadding;
//     var toplimitmin = zoompadding;
//     var leftposition = 0;
//     var topposition = 0;

//     var heroposx = player.GetBody().GetPosition().x * SCALE;
//     var ltr = player.GetBody().GetLinearVelocity().x >= 0 ? true : false;

//     if (heroposx >= (VP.left + (VP.width - AW.rightpad)) && ltr) {
//       leftposition = heroposx + AW.rightpad - VP.width;
//     } else if (heroposx <= (-VP.left) + AW.leftpad) {
//       leftposition = heroposx - AW.leftpad;
//     } else {
//       leftposition = -VP.left;
//     }

//     if (leftposition < leftlimitmin) {
//       leftposition = leftlimitmin;
//     } else if (leftposition > leftlimitmax) {
//       leftposition = leftlimitmax;
//     }

//     $("#easelcan").css({ left: 0, transition: "left 34ms" });

//     var heroposy = player.GetBody().GetPosition().y * SCALE;

//     if (heroposy >= (VP.top + (VP.height - AW.rightpad))) {
//       topposition = heroposy + AW.bottompad - VP.height;
//     } else if (heroposy <= ((-VP.top) + AW.toppad)) {
//       topposition = heroposy - AW.toppad;
//     } else {
//       topposition = -VP.top;
//     }

//     if (topposition < toplimitmin) {
//       topposition = toplimitmin;
//     }
//     if (topposition > toplimitmax) {
//       topposition = toplimitmax;
//     }

//     $("#easelcan").css({ toppad: -topposition, transition: "left 34ms" });

//     var herovelocity = Math.abs(player.GetBody().GetLinearVelocity().x) / 10;

//     var scale =
//       herovelocity < 0.8 && herovelocity > 0.1
//         ? 1.1
//         : herovelocity > 1.1
//         ? 0.8
//         : 1;

//     $("#easelcan").css({
//       transform: "scale(" + scale + ")",
//       transition: "transform 3000ms",
//     });
//   }
// }
