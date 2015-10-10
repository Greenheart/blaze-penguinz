Meteor.publish('rooms', function() {
  return Rooms.find();
});
Meteor.publish('users', function() {
  return Meteor.users.find();
});


Meteor.methods({
  addRoom: function() {
    Rooms.insert({ players: [Meteor.userId()] });
  },
  joinRoom: function(roomId) {
    Rooms.update(roomId, {$push: { players: Meteor.userId() } } );
  },
  removeRoom: function(roomId) {
    Rooms.remove({ _id: roomId });
  }
});
