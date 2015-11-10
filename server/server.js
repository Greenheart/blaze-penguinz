Meteor.publish('rooms', function() {
  //TODO: more secure version (add on deployment) --> return Rooms.find({ players: Meteor.userId });
  return Rooms.find();
});
Meteor.publish('users', function() {
  //TODO: fix this to only publish
  /*
      1. username
      2. userId's
      3. rating
      4. friendlist --> only your own
  */
  return Meteor.users.find();
});

Accounts.onCreateUser(function(options, user) {
  // Add a custom profile to every user that signs up
  if (options.profile) {
    user.profile = options.profile
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

    // Only allow players to join one room at a time
    //TODO: Also add a check like this on the client, to inactivate the join-button or something when a room is joined
    if (Rooms.findOne({ players: Meteor.userId() })) {
      return;
    }

    var room = Rooms.findOne({
      players: {
        $nin: [Meteor.userId()],  // only allow players to join a room once
        $not: {
          $size: ROOM_MAX_PLAYERS // only find rooms that aren't full
        }
      }
    });

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

    Will only allow the room host to start the game
    */


    //NOTE: might be worth to restrict this method to only work if room has a certain number of users (Full room?)
    var room = Rooms.findOne({ players: Meteor.userId() });
    // only allow the host --> room.players[0] to start the game
    if (room.players[0] === Meteor.userId()) {
      console.log("starting game in room " + room._id);
      var query = {
        $set: {}
      };

      // set default values for each player
      room.players.forEach(function(user) {
        query.$set["playerTarget." + user] = [];
        query.$set["spellTarget." + user] = [];
        query.$set["playerHP." + user] = 100;
      });

      Rooms.update(roomId, query);
    }
  },
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
    */
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
  }
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
    spellTarget: {}
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
