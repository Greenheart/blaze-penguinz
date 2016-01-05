Meteor.publish('rooms', function() {
  return Rooms.find({ players: this.userId });
});

Meteor.publish('currentUser', function() {
  return Meteor.users.find({ _id: this.userId }, {
    fields: {
      'profile': 1,
      'username': 1
    }
  });
});

Meteor.publish("usersInCurrentRoom", function() {
  if (this.userId) {
    var room = Rooms.findOne({ players: this.userId }, {
      fields: {
        players: 1,
        _id: 0
      }
    });
    if (room) {
      // remove currentUser from the array
      room.players.splice(room.players.indexOf(this.userId), 1);

      // get the cursor that finds info about users in the current room
      return usersInRoom = Meteor.users.find({
        _id: {
          $in: room.players
        }
      }, {
        fields: {
          'profile.rating': 1,
          'username': 1
        }
      });
    }
  }
});

Meteor.publish('friends', function() {
  if (this.userId) {
    return Meteor.users.find({
      _id: {
        $in: Meteor.users.findOne({ _id: this.userId }, {
          fields: {
            'profile.friends': 1
          }
        }).profile.friends
      }
    }, {
      fields: {
        'profile.rating': 1,
        'username': 1
      }
    });
  }
});

Meteor.publish("onlineStatus", function() {
  return Meteor.users.find({ "status.online": true }, {
    fields: {
      'status.online': 1
    }
  });
});



Accounts.validateNewUser(function (user) {
  if (user.username && user.username.length <= 12 && user.username.length >= 3) {
    return true;
  }
  throw new Meteor.Error("", "Usernames can't be longer than 12 characters");
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

  joinRoom: function(friendId) {
    /*
    Find a room with available slots and add the current player to it
    */

    if (this.userId) {
      if (Rooms.findOne({ players: this.userId }, { fields: { _id: 1 } })) {
        return "You can only be in one room at a time!";
      }

      if (friendId) {
        var room = Rooms.findOne({
          players: {
            $not: {
              $size: ROOM_MAX_PLAYERS // Only find rooms with available slots
            },
            $in: [ friendId ]
          },
          inGame: false
        }, {
          fields: {
            _id: 1
          }
        });
      } else {
        var room = Rooms.findOne({
          players: {
            $not: {
              $size: ROOM_MAX_PLAYERS // Only find rooms with available slots
            }
          },
          isPublic: true              // Only find public games --> skip invite-only party lobbies
        }, {
          fields: {
            _id: 1
          }
        });
      }

      if (room) {
        addToRoom(room._id);
      } else {
        if (friendId) {
          return "You cannot join this room";
        } else {
          createRoom(true); // set flag "join" to true to also add the current user to the new room
        }
      }
    }
  },

  addNewRoom: function(join, isPublic) {
    if (this.userId) {
      if (!Rooms.findOne({ players: this.userId }, { fields: { _id: 1 } })) {
        // Only allow if user isn't already in a room
        createRoom(join, isPublic);
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

        Rooms.update(room._id, query);
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

      var userFriends = Meteor.users.findOne({ _id: this.userId }, {
        fields: {
          _id: 0,
          'profile.friends': 1
        }
      }).profile.friends;


      if (user && userFriends.indexOf(user._id) > -1) {
        return "You're already friends with "+query.username+"!";
      }

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
        _id: 1,
        'profile.invites': 1
      }
    });

    if (user && user.profile.invites.indexOf(Meteor.userId()) > -1) {
      return; // It's only possible to invite a user one time
    }

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

function createRoom(join, isPublic) {
  /*
  Create a new empty room

  join: Boolean flag --> Should we also add the current user to the newly created room?
  isPublic: String flag --> Should room be public?
  */

  if (isPublic === "invite") {
    isPublic = false;
  } else {
    isPublic = true;
  }

  var room = {
    players: [],
    playerTarget: {},
    playerHP: {},
    spellTarget: {},
    inGame: false,
    isPublic: isPublic
  }

  Rooms.insert(room, function(err, roomInserted) {
    if (err) {
      console.log(err);
    } else {
      console.log("creating new room: " + roomInserted);
      if (join) {
        addToRoom(roomInserted);
      }
    }
  });
}
