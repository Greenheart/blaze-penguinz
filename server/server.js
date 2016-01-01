Meteor.publish('rooms', function() {
  //TODO: more secure version (add on deployment) --> return Rooms.find({ players: Meteor.userId });
  return Rooms.find();

});

Meteor.publish('currentUser', function() {
  return Meteor.users.find({}, {
    fields: {
      'status.online': 1,
      'profile': 1,      // Includes 'profile.friends' to allow current user to see their friendlist
      'username': 1
    }
  })
});

Meteor.publish('otherUsers', function() {
  return Meteor.users.find({}, {
    fields: { // only publish these fields (+ '_id')
      'status.online': 1,
      'profile.rating': 1,
      'username': 1
    }
  });
});



/*
TODO:

* Allow users to switch between 'Friends' and 'Online Users' in the left sidebar
  * https://stackoverflow.com/questions/29425906/how-can-i-create-a-list-of-online-active-users
  * ^ Examples of code that solves this
*/

Accounts.onCreateUser(function(options, user) {
  // Add a custom profile to every user that signs up
  if (options.profile) {
    user.profile = options.profile;
  } else {
    user.profile = {};
  }
  user.profile.friends = [];
  user.profile.rating = 1000;
  return user;
});






Meteor.methods({
// ------------------------------ ROOM METHODS ---------------------------------

  joinRoom: function() {
    /*
    Find a room with available slots and add the current player to it
    */

    var room = Rooms.findOne({
      players: {
        $not: {
          $size: ROOM_MAX_PLAYERS // Only find rooms with available slots
        }
      },
      isPublic: true              // Only find public games --> skip invite-only party lobbies
    });

    if (room && room.players.indexOf(Meteor.userId()) > -1) {
      return;   // Only allow players to join one room at a time
    }

    if (room) {
      addToRoom(room._id);
    } else {
      createRoom(true); // set flag "addUser" to true to also add the current user to the new room
    }
  },
  removeRoom: function(roomId) {
    Rooms.remove({ _id: roomId });
  },


  // ----------------------------- GAME METHODS ----------------------------------

    startGame: function() {
      /*
      Make a room ready for a game by setting default values

      Will only allow the room host (players[0]) to start the game
      */

      var room = Rooms.findOne({ players: Meteor.userId() });
      // only allow the host --> room.players[0] to start the game
      //TODO: test that this works --> Make sure there are at least 2 players in the room to begin the match
      if (room.players[0] === Meteor.userId() && room.players.length >= 2) {
        console.log("starting game in room " + room._id);
        var query = {
          $set: {
            inGame: true
          }
        };

        //TODO: add default positions in a circle around the center coordinate in the world
        // check some early episode of 'Coding Math' trigonometry on youtube for implementation

        // set default values for each player
        room.players.forEach(function(userId) {
          query.$set["playerTarget." + userId] = [];
          query.$set["spellTarget." + userId] = [];
          query.$set["playerHP." + userId] = 100;
        });

        Rooms.update(roomId, query);
      }
    }/*,
    updatePlayerTarget: function(position) {
      var query = {
        $set: {}
      };

      query.$set["playerTarget." + Meteor.userId()] = position;
      Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);
    },
    takeDamage: function(type) {
      /*
      Update the health of the current player

      type: Integer storing type of damage taken --> Either ranged spell hit (1) or damage per second (2)
      *\/
      var query = {
        $inc: {}
      }

      if (type === 1) {
        var dmg = RANGED_SPELL_DMG;
      } else if (type === 2) {
        var dmg = DAMAGE_PER_SECOND;
      }

      query.$inc["playerHP." + Meteor.userId()] = dmg;
      Rooms.update(Rooms.findOne({ players: Meteor.userId() })._id, query);
  }*/
});













// ------------------------------ ROOM HELPERS ---------------------------------

function addToRoom(roomId) {
  /*
  Add the current player to a specific room
  */
  console.log("adding " + Meteor.userId() + " to room " + roomId);

  Rooms.update(roomId, {
    $push: {
      players: Meteor.userId()
    }
  });
}

function createRoom(addUser) {
  /*
  Create a new empty room

  addUser: Boolean flag --> Should we also add the current user to the newly created room?
  */
  var room = {
    players: [],
    playerTarget: {},
    playerHP: {},
    spellTarget: {},
    inGame: false,
    isPublic: true  // TODO: How are we going to handle public and invite-only-rooms?
                    //       This solution allows us to filter and only work with rooms of the right type
  }

  Rooms.insert(room, function(err, roomInserted) {
    if (err) {
      console.log(err);
    } else {
      console.log("creating new room: " + roomInserted);
      if (addUser) {
        addToRoom(roomInserted);
      }
    }
  });
}
