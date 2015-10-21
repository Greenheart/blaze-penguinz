var query;

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
      playerPos: {},
      spellPos: {}
    };

    room.playerPos[Meteor.userId()] = [];
    room.spellPos[Meteor.userId()] = [];
    Rooms.insert(room);

    /*Rooms.insert({
      players: [Meteor.userId()],
      playerPos: { Meteor.userId() : [x, y] }
    });*/
  },
  joinRoom: function(roomId) {
    var query = {
      $push: { players: Meteor.userId()},
      $set: {}
    };
    query.$set["playerPos." + Meteor.userId()] = [];
    query.$set["spellPos." + Meteor.userId()] = [];

    Rooms.update(roomId, query);
  },
  removeRoom: function(roomId) {
    Rooms.remove({ _id: roomId });
  },
  pushPos: function(position) {
    query = {
      $set: {}
    };
    query.$set["playerPos." + Meteor.userId()] = position;

    Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);
  }
});
