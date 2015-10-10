var dude;
var rangedSpells;
var rangedSpellCooldown = 1000;
var nextFireTime = 0;
var dudeAnimFrames = [[0,1,2,3], [4,5,6,7], [8,9,10,11], [12,13,14,15], [16,17,18,19]]
var myDudeIndex = null;

Template.body.helpers({
  'game': function() {
    game = new Phaser.Game(1280, 720, Phaser.AUTO, 'container',
    { preload: preload, create: create, update: update, render: render });
  }
});

function preload() {
  game.load.spritesheet('fireball', 'img/fireball1.png', 32, 32);
  game.load.spritesheet('penguins', 'img/penguins.png', 64, 64);
  game.load.audio('fireballSFX', 'audio/fireball.wav');
  game.load.audio('music', 'audio/music.wav');
}

function create() {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
  game.stage.disableVisibilityChange = true;
  game.stage.backgroundColor = '#124184';
  game.physics.startSystem(Phaser.Physics.NINJA);
  game.physics.ninja.gravity = 0;

  initSounds();
  initDudes();
  initRangedSpells(20);

  game.input.mouse.capture = true;
}

function update() {
  updateDudes();
  updateSpells();
}

function render() {
  /*rangedSpells.forEachAlive(function(spell) {
    game.debug.body(spell);
  });*/
}

//--------------------------------------------------GENERAL---------------------------------------------------

function moveToPos(object, x, y) {
  if (!Phaser.Circle.contains(new Phaser.Circle(object.body.x, object.body.y, 10), x, y)) {
    angle = game.physics.arcade.angleToXY(object, x, y);
    angleDeg = angle * (180/Math.PI);
    object.rotation = angle;
    object.body.moveTo(object.moveSpeed, angleDeg);
    object.moving = true;
    console.log("Moving...");
  }
}
function moveByAngle (object, angle) {
  angleDeg = angle * (180/Math.PI);
  object.rotation = angle;
  object.body.moveTo(object.moveSpeed, angleDeg);
}

//-----------------------------------------------------DUDES------------------------------------------------------------

function initDudes() {
  // Get all playerIds from the room that this game starts in
  players = Rooms.findOne({ players: Meteor.userId() }).players;

  // Count how many physical player objects this room shall contain (as many as there are players in the room.players array)
  amount = players.length;

  // Create the physical (ingame) group for all the playes
  dudes = game.add.group();
  // Make as many physical group objects as there are players
  dudes.createMultiple(amount, 'penguins');

  for (i = 0; i < dudes.children.length; i++) {
    // Loop through the physical group of objects and give every object a username (from the username of the player with the id)
    dudes.children[i].username = Meteor.users.findOne({ _id: players[i] }).username;
    dudes.children[i].owner = Meteor.users.findOne({ _id: players[i] })._id;

    // If the dude at point i in the array is your dude, set nyDudeIndex to i
    if (dudes.children[i].owner === Meteor.userId()) {
      myDudeIndex = i;
    }
  }
  dudes.forEach(function(dude) {
    dude.animations.add('walk', dudeAnimFrames[dude.z -1], 15, true);
    dude.reset(100, 100);
    dude.alive = true;
    dude.moveSpeed = 300;
    dude.radius = 20;
    dude.target = null;
    dude.moving = false;
    dude.casting = false;
    dude.anchor.set(0.5);
    game.physics.ninja.enableCircle(dude, dude.radius);
  });
}

function updateDudes() {
  var oldTarget = dudes.children[myDudeIndex].target;

  if (game.input.activePointer.rightButton.isDown && !dudes.children[myDudeIndex].casting) {
    dudes.children[myDudeIndex].target = [game.input.activePointer.x, game.input.activePointer.y];
  }

  dudes.children.forEach( function(dude) {
    if (dude.target && dude.target != oldTarget) {
      moveToPos(dude, dude.target[0], dude.target[1]);
    }
    if (dude.moving) {
      dude.animations.play('walk');
      if (Phaser.Circle.contains(new Phaser.Circle(dude.body.x, dude.body.y, 10), dude.target[0], dude.target[1])) {
        stopDude(dude);
      }
    }
  })
}

function stopDude(dude) {
  dude.body.setZeroVelocity();
  dude.target = null;
  dude.moving = false;
  dude.animations.stop('walk', true);
}

//--------------------------------------------------RANGED SPELL---------------------------------------------------

function initRangedSpells(amount) {
  // initiate the group for ranged-spell-objs
  rangedSpells = game.add.group();
  rangedSpells.createMultiple(amount, 'fireball');
  rangedSpells.setAll('checkWorldBounds', true);
  rangedSpells.setAll('outOfBoundsKill', true);
  rangedSpells.forEach(function(spell) {
    game.physics.ninja.enableCircle(spell, 10);
    spell.body.collideWorldBounds = false;
    spell.animations.add('fly', [0, 1, 2, 3, 4], 15, true);
    spell.anchor.set(0.8, 0.5);
    spell.moveSpeed = 600;
    spell.scale.set(2);
  });
}
function spawnRangedSpell(player, pointer) {
  // create a new spell-obj

  if (game.time.now > nextFireTime){
    player.casting = true;
    nextFireTime = game.time.now + rangedSpellCooldown;

    stopDude();

    var spell = rangedSpells.getFirstDead();
    spell.alpha = 0;
    spell.reset(player.body.x, player.body.y);

    //rotate player to the correct firing-angle
    angle = game.physics.arcade.angleToPointer(spell, pointer)
    player.rotation = angle;

    //simple (and still buggy) casting time
    game.time.events.add(Phaser.Timer.SECOND * 0.5, function() {
      fireballSFX.play();
      spell.alpha = 1;
      spell.animations.play('fly');
      moveByAngle(spell, angle);
      player.casting = false;
    });
  }
}
function updateSpells() {
  if (game.input.activePointer.leftButton.isDown && !dude.casting) {
    spawnRangedSpell(dude, game.input.activePointer);
  }
}

//--------------------------------------------------INITS----------------------------------------------------

function initSounds() {
  fireballSFX = game.add.audio('fireballSFX', 0.5);
  music = game.add.audio('music', 0, true);
  music.play();
}
