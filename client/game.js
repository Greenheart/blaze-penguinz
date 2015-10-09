var dude;

Template.body.helpers({
  'game': function() {
    game = new Phaser.Game(1280, 720, Phaser.AUTO, 'container',
    { preload: preload, create: create, update: update, render: render });
  }
});

function preload() {
  game.load.image('dude', 'img/man.png')
}

function create() {
  game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
  game.physics.startSystem(Phaser.Physics.NINJA);
  game.physics.ninja.gravity = 0;

  makeDude(game.world.centerX, game.world.centerY);

  game.input.mouse.capture = true;
}

function update() {
  updateDude();
}

function render() {
  game.debug.body(dude);
}



function move(object, pointer) {
  angle = game.physics.arcade.angleToPointer(object, pointer)
  angleDeg = angle * (180/Math.PI);
  object.rotation = angle;
  object.body.moveTo(object.moveSpeed, angleDeg);
  dude.target = [pointer.x, pointer.y];
}






function makeDude(x, y) {
  dude = game.add.sprite(x, y, 'dude');
  dude.moveSpeed = 300;
  dude.radius = 30;
  dude.target = null;
  dude.anchor.set(0.5);
  game.physics.ninja.enableCircle(dude, dude.radius);
}

function updateDude() {
  if (game.input.activePointer.rightButton.isDown) {
    move(dude, game.input.activePointer);
  }

  if (dude.target) {
    if (Phaser.Circle.contains(new Phaser.Circle(dude.body.x, dude.body.y, 10), dude.target[0], dude.target[1])) {
      dude.body.setZeroVelocity();
    }
  }
}
