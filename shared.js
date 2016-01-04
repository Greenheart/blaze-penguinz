ROOM_MAX_PLAYERS = 5; //Temp for development of the room-system --> deploy: 5
USERNAME_MAX_LEN = 12;

Rooms = new Mongo.Collection('rooms');


Meteor.methods({
  toggleRoomType: function(roomId) {
    /*
    Flips the isPublic-state for a given room

    params:
      * roomId id of the current room
    */

    var room = Rooms.findOne({ _id: roomId }, {
      fields: {
        _id: 0,
        players: 1,
        isPublic: 1
      }
    });
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

  removeInvite: function() {
    Meteor.users.update({ _id: Meteor.userId() }, {
      $pull: {
        'profile.invites': Meteor.user().profile.invites[0]
      }
    });
  },

  leaveRoom: function(room) {
    if (room) {
      if (this.userId) {
        console.log("Removing room " + room._id);
        // Leave your current room and if you are the last person to leave -> remove it
        if (room.players.indexOf(this.userId > -1)) {
          // The player is in the room
          if (room.players.length == 1) {
            Rooms.remove(room._id)

          } else {
            Rooms.update(room._id, {
              $pull: {
                players: this.userId
              }
            });
          }
        }
      }
    }
  }
});
