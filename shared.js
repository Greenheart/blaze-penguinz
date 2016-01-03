ROOM_MAX_PLAYERS = 3; //Temp for development of the room-system --> deploy: 5
USERNAME_MAX_LEN = 12;

Rooms = new Mongo.Collection('rooms');


Meteor.methods({
  toggleRoomType: function(roomId) {
    /*
    Flips the isPublic-state for a given room

    params:
      * roomId id of the current room
    */

    var room = Rooms.findOne({ _id: roomId });
    if (room && room.players[0] === Meteor.userId()) {
      // Only allow the room's host to make the change
      Rooms.update({ _id: roomId }, {
        $set: {
          isPublic: !room.isPublic
        }
      }, function(err, res) {
        if (err) {
          throw new Meteor.Error(500, 'There was an error processing your request');
        }
      });
    }
  },
  declineInvite: function() {
    Meteor.users.update({ _id: Meteor.userId() }, {
      $pull: {
        'profile.invites': Meteor.user().profile.invites[0]
      }
    });
  }
});
