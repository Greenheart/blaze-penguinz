var dude;
var rangedSpells;
var rangedSpellCooldown = 2000;
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
  //display loading progress
  var loadingText = game.add.text(game.world.centerX, game.world.centerY, 'loading... 0%', { fill: '#ffffff' });
  loadingText.anchor.setTo(0.5);

  game.load.onFileComplete.add(function(progress) {
    // every time a file is loaded, update loading progress text
    if (progress === 0 || progress === 100) {
      // if completed, remove text
      game.world.remove(loadingText);
    } else {
      loadingText.text = 'loading... ' + progress + '%';
    }
  }, this);

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
  initRangedSpells(20);
  initDudes();

  game.input.mouse.capture = true;
}

function update() {
  updateDudes();
  updateRangedSpells();
}

function render() {
  dudes.forEachAlive(function(dude) {
    game.debug.body(dude);
  });
  rangedSpells.forEachAlive(function(spell) {
    game.debug.body(spell);
  });
}

//--------------------------------------------------GENERAL---------------------------------------------------

function moveToPos(object, x, y) {
  if (!Phaser.Circle.contains(new Phaser.Circle(object.body.x, object.body.y, 10), x, y)) {
    angle = game.physics.arcade.angleToXY(object, x, y);
    angleDeg = angle * (180/Math.PI);
    object.rotation = angle;
    object.body.moveTo(object.moveSpeed, angleDeg);
    object.moving = true;
    //console.log("Moving...");
  }
}
function moveByAngle (object, angle) {
  angleDeg = angle * (180/Math.PI);
  object.rotation = angle;
  object.body.moveTo(object.moveSpeed, angleDeg);
}

function collisionCircleCircle (a, b) {
  /* Detect if two circlular bodies collide */
  if (Math.pow(Math.abs(b.x - a.x), 2) + Math.pow(Math.abs(a.y - b.y), 2) <= Math.pow(a.radius + b.radius, 2)) {
    return true;
  }
  return false;
}

function isSame(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }

  return array1.every(function(element, index) {
    // check if every elem of arr1 is in arr2 on same position
    return element === array2[index];
  });
}

//-----------------------------------------------------DUDES------------------------------------------------------------

function initDudes() {
  // Get all playerIds from the room that this game starts in
  var room = Rooms.findOne({ players: Meteor.userId() });
  // Create the physical (ingame) group for all the playes
  dudes = game.add.group();
  // Make as many physical group objects as there are players
  dudes.createMultiple(room.players.length, 'penguins');

  dudes.forEach(function(dude) {
    dude.username = Meteor.users.findOne({ _id: room.players[dude.z -1] });
    dude.owner = Meteor.users.findOne({ _id: room.players[dude.z - 1] })._id;

    if (dude.owner === Meteor.userId()) {
      myDudeIndex = dude.z - 1;
    }

    dude.animations.add('walk', dudeAnimFrames[dude.z -1], 15, true);
    dude.reset(game.world.centerX, game.world.centerY);
    dude.alive = true;
    dude.moveSpeed = 300;
    dude.radius = 20;
    dude.health = room.playerHealth[room.players[dude.z - 1]];
    dude.moving = false;
    dude.casting = false;
    dude.target = [];
    dude.spellTarget = [];
    dude.anchor.set(0.5);
    game.physics.ninja.enableCircle(dude, dude.radius);
    dude.body.checkCollision = true;
    dude.body.collideWorldBounds = true;
  });
}

function updateDudes() {

  // Change the target of this players dude if requested and possible
  if (game.input.activePointer.rightButton.isDown && !dudes.children[myDudeIndex].casting) {
    // If the player is moving to another target position than the one in db
    if (! isSame([game.input.activePointer.x, game.input.activePointer.y],  Rooms.findOne({ players: Meteor.userId() }).playerTarget[Meteor.userId()])) {

      // Update position in db
      Meteor.call('updatePlayerTarget', [game.input.activePointer.x, game.input.activePointer.y]);
    }
  }

  dudes.forEachAlive( function(dude) {

    // update each dude's health with latest value from db
    dude.health = Rooms.findOne({ players: dude.owner }).playerHealth[dude.owner];

    if (! isSame(dude.target, Rooms.findOne({ players: dude.owner }).playerTarget[dude.owner])) {
      // grab the lastest target (for every dude) from the db
      dude.target = Rooms.findOne({ players: dude.owner }).playerTarget[dude.owner];

      // if the dude has a target
      if (! isSame(dude.target, [])) {
        moveToPos(dude, dude.target[0], dude.target[1]);
      }
    }

    // Only check collisions against others than self
    if (dude.owner !== Meteor.userId()) {

      // Check player-player - collisions
      if (collisionCircleCircle(dudes.children[myDudeIndex], dude)) {
        /*TODO: implement proper collision handling here --> make players push each other
                depending on their speed and angle upon collision */
        if (dudes.children[myDudeIndex].alive) {
          // only affect other players when the current player is alive
        //TODO:   change this collision detection to handle any two penguins and
        //          not always compare against the curent player
        //        Right now the third and the second player can't collide since
        //          we always check against the first (current player)
          stopDude(dude);
          stopDude(dudes.children[myDudeIndex]);
        }
        console.log("player-player-collision!");
      }
    }

    rangedSpells.forEachAlive(function(spell) {
      // Check player-spell - collisions
      if (spell.owner !== dude.owner &&
          collisionCircleCircle(dude, spell)) {
        console.log("player-spell-collision!");

        spell.kill(); // maybe set a timeout before killing the spell obj and give a feeling of a greater pushback?
        // TODO: collisions should push players around and not just kill them

        // only report your own damage to not have all clients send data
        if (dude.owner === Meteor.userId()) {
          console.log("taking damage");
          Meteor.call("takeDamage", 1);
        }
      }
    });

    if (dude.moving) {
      dude.animations.play('walk');
      if (! isSame(dude.target, [])) {
        if (Phaser.Circle.contains(new Phaser.Circle(dude.body.x, dude.body.y, 10), dude.target[0], dude.target[1])) {
          stopDude(dude);
        }
      }
    }
  });
}

function stopDude(dude) {
  dude.body.setZeroVelocity();
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
    spell.radius = 10;
    game.physics.ninja.enableCircle(spell, spell.radius);
    spell.body.collideWorldBounds = false;
    spell.animations.add('fly', [0, 1, 2, 3, 4], 15, true);
    spell.anchor.set(0.8, 0.5);
    spell.moveSpeed = 600;
    spell.scale.set(2);
    spell.owner = null;
  });
}


function spawnRangedSpell(dude, x, y) {
  // create a new spell-obj

  dude.casting = true;
  stopDude(dude);

  var spell = rangedSpells.getFirstDead();
  spell.alpha = 0;
  spell.owner = dude.owner;
  spell.reset(dude.body.x, dude.body.y);

  //rotate player to the correct firing-angle
  var angle = game.physics.arcade.angleToXY(spell, x, y);
  dude.rotation = angle;

  //add a small casttime before casting the spell
  game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
    fireballSFX.play();
    spell.animations.play('fly');
    moveByAngle(spell, angle);

    var query = {
      $set: {}
    };
    query.$set["spellTarget." + Meteor.userId()] = [];
    Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);

    dude.casting = false;

    // Wait a bit before revelaing the spell on screen to avoid sprite collision between spell and player
    game.time.events.add(Phaser.Timer.SECOND * 0.02, function() {
      spell.alpha = 1;
    });
  });
}


function updateRangedSpells() {

  if (game.input.activePointer.leftButton.isDown && !dudes.children[myDudeIndex].casting) {
    if (game.time.now > nextFireTime) {

      // set the time when a spell can be cast again
      nextFireTime = game.time.now + rangedSpellCooldown;

      // send data to db about the cast spell target points
      var query = {
        $set: {}
      };
      query.$set["spellTarget." + Meteor.userId()] = [game.input.activePointer.x, game.input.activePointer.y];
      Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);

    }
  }

  dudes.forEachAlive( function(dude) {

    // If the position in the database is different than the one player has locally
    if (! isSame(dude.spellTarget, Rooms.findOne({ players: dude.owner }).spellTarget[dude.owner])) {

      // Change the local target to the new one from the database
      dude.spellTarget = Rooms.findOne({ players: dude.owner }).spellTarget[dude.owner];

      // If there is a local spellTarget
      if (! isSame(dude.spellTarget, [])) {
        if (! dude.casting) {
          spawnRangedSpell(dude, dude.spellTarget[0], dude.spellTarget[1]);
        }
      }
    }

    // check if player still is alive
    if (dude.health <= 0) {
      dude.kill();

      if (dude.owner === Meteor.userId()) {
        // window.alert("You got pWned! ");
        // TODO: display message to player who got killed
        //          --> possibly by showing a message-box in the UI in client.js-file
      }
      //TODO: play animation, play sound or something
      // also add score to player who got the kill
    }
  });
}

//--------------------------------------------------INITS----------------------------------------------------

function initSounds() {
  fireballSFX = game.add.audio('fireballSFX', 0.5);
  music = game.add.audio('music', 1, true);
  music.play();
}
