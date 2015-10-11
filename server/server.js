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

    room.playerPos[Meteor.userId()] = null;
    room.spellPos[Meteor.userId()] = null;
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
    query.$set["playerPos." + Meteor.userId()] = null;
    query.$set["spellPos." + Meteor.userId()] = null;

    Rooms.update(roomId, query);
  },
  removeRoom: function(roomId) {
    Rooms.remove({ _id: roomId });
  }
});
