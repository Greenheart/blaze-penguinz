Meteor.publish('rooms', function() {
  //TODO: more secure version (add on deployment) --> return Rooms.find({ players: Meteor.userId });
  if (this.userId) {
    return Rooms.find();
  }
});

Meteor.publish('currentUser', function() {
  if (this.userId) {
    return Meteor.users.find({ _id: this.userId }, {
      fields: {
        'status.online': 1,
        'profile': 1,      // Includes 'profile.friends' to allow current user to see their friendlist
        'username': 1
      }
    });
  }
});

Meteor.publish("usersInCurrentRoom", function() {
  if (this.userId) {
    var room = Rooms.findOne({ players: this.userId });
    if (room) {
      // remove currentUser from the array
      room.players.splice(room.players.indexOf(this.userId), 1);

      // get the cursor that finds info about users in the current room
      var usersInRoom = Meteor.users.find({
        players: {
          $in: room.players
        }
      }, {
        'status.online': 1,
        'profile.rating': 1,
        'username': 1
      });
    }
  }
});

Meteor.publish('friends', function() {
  if (this.userId) {
    return Meteor.users.find({
      _id: {
        $in: Meteor.users.findOne({ _id: this.userId }).profile.friends
      }
    }, {
      fields: {
        'status.online': 1,
        'profile.rating': 1,
        'username': 1
      }
    });
  }
});

Meteor.publish("onlineStatus", function() {
  if (this.userId) {
    return Meteor.users.find({ "status.online": true }, {
      fields: {
        'status.online': 1
      }
    });
  }
});

Accounts.onCreateUser(function(options, user) {
  // Add a custom profile to every user that signs up
  if (options.profile) {
    user.profile = options.profile;
  } else {
    user.profile = {};
  }
  user.profile.friends = [];
  user.profile.rating = 1000;
  user.profile.invites = [];
  return user;
});






Meteor.methods({
// ------------------------------ ROOM METHODS ---------------------------------

  joinRoom: function() {
    /*
    Find a room with available slots and add the current player to it
    */

    if (this.userId) {
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
    }
  },


  // ----------------------------- GAME METHODS ----------------------------------

  startGame: function() {
    /*
    Make a room ready for a game by setting default values

    Will only allow the room host (players[0]) to start the game
    */
    if (this.userId) {
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
    }
  },
  addFriend: function(query) {
  	// Search for user with username in query.username

    if (this.userId) {
      var user = Meteor.users.findOne(query, {
        fields: {
          username: 1
        }
      });

      if (user) {
        Meteor.users.update({ _id: Meteor.userId() }, {
          $push: {
            'profile.friends': user._id
          }
        });

      } else {
        return "Couldn't find "+query.username;
      }
    }
  },
  invitePlayer: function(query) {

    // Fetch the user that is to be sent an invite
    var user = Meteor.users.findOne(query, {
      fields: {
        _id: 1
      }
    });

    // If the user was found, send him an invite from the player that sent it
    if (user) {
      Meteor.users.update({ _id: user._id }, {
        $push: {
          'profile.invites': Meteor.userId()
        }
      });
    } else {
      return "Could not invite player";
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
