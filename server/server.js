Meteor.publish('rooms', function() {
  return Rooms.find();
});
Meteor.publish('users', function() {
  return Meteor.users.find();
});


Meteor.methods({
  addRoom: function() {
    var room = {
      players: [Meteor.userId()],
      playerTarget: {},
      spellTarget: {},
      playerHealth: {}
    };

    room.playerTarget[Meteor.userId()] = [];
    room.spellTarget[Meteor.userId()] = [];
    room.playerHealth[Meteor.userId()] = 100;
    Rooms.insert(room);

    /*Rooms.insert({
      players: [Meteor.userId()],
      playerTarget: { Meteor.userId() : [x, y] }
    });*/
  },
  joinRoom: function(roomId) {
    var query = {
      $push: { players: Meteor.userId()},
      $set: {}
    };
    query.$set["playerTarget." + Meteor.userId()] = [];
    query.$set["spellTarget." + Meteor.userId()] = [];
    query.$set["playerHealth." + Meteor.userId()] = 100;

    Rooms.update(roomId, query);
  },
  removeRoom: function(roomId) {
    Rooms.remove({ _id: roomId });
  },
  pushPos: function(position) {
    var query = {
      $set: {}
    };

    query.$set["playerTarget." + Meteor.userId()] = position;
    Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);
  },
  takeDamage: function(type) {
    /*
    update the health of the current player
    type: Integer storing type of damage taken --> Either ranged spell hit (1) or damage per second (2)
    */
    var query = {
      $inc: {}
    }

    if (type === 1) {
      var dmg = -33;
    } else if (type === 2) {
      var dmg = -DAMAGE_PER_SECOND;
    }

    query.$inc["playerHealth." + Meteor.userId()] = dmg;
    Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);
  }
});
