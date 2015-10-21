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
      spellTarget: {}
    };

    room.playerTarget[Meteor.userId()] = [];
    room.spellTarget[Meteor.userId()] = [];
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
  }
});
