var dude;
var rangedSpells;
var rangedSpellCooldown = 1000;
var nextFireTime = 0;

Template.body.helpers({
  'game': function() {
    game = new Phaser.Game(1280, 720, Phaser.AUTO, 'container',
    { preload: preload, create: create, update: update, render: render });
  }
});

function preload() {
  game.load.spritesheet('dude', 'img/pingvin.png', 64, 64);
  game.load.spritesheet('fireball', 'img/fireball1.png', 32, 32);
  game.load.audio('fireballSFX', 'audio/fireball.wav');
  game.load.audio('music', 'audio/music.wav');
}

function create() {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
  game.stage.backgroundColor = '#124184';
  game.physics.startSystem(Phaser.Physics.NINJA);
  game.physics.ninja.gravity = 0;

  initSounds();
  initRangedSpells(20);
  initDude(game.world.centerX, game.world.centerY);

  game.input.mouse.capture = true;
}

function update() {
  updateDude();
  updateSpells();
}

function render() {
  game.debug.body(dude);

  rangedSpells.forEachAlive(function(spell) {
    game.debug.body(spell);
  });
}




//--------------------------------------------------GENERAL---------------------------------------------------

function moveToObject(object, pointer) {
  angle = game.physics.arcade.angleToPointer(object, pointer)
  angleDeg = angle * (180/Math.PI);
  object.rotation = angle;
  object.body.moveTo(object.moveSpeed, angleDeg);
  object.target = [pointer.x, pointer.y];
}
function moveByAngle (object, angle) {
  angleDeg = angle * (180/Math.PI);
  object.rotation = angle;
  object.body.moveTo(object.moveSpeed, angleDeg);
}

//--------------------------------------------------DUDE---------------------------------------------------

function initDude(x, y) {
  dude = game.add.sprite(x, y, 'dude');
  dude.animations.add('walk', [0,1,2,3], 15, true);
  dude.moveSpeed = 300;
  dude.radius = 20;
  dude.target = null;
  dude.casting = false;
  dude.anchor.set(0.5);
  game.physics.ninja.enableCircle(dude, dude.radius);
}
function updateDude() {
  if (game.input.activePointer.rightButton.isDown && !dude.casting) {
    moveToObject(dude, game.input.activePointer);
  }

  if (dude.target) {
    dude.animations.play('walk');
    if (Phaser.Circle.contains(new Phaser.Circle(dude.body.x, dude.body.y, 10), dude.target[0], dude.target[1])) {
      stopDude();
    }
  }
}
function stopDude() {
  dude.body.setZeroVelocity();
  dude.target = null;
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
