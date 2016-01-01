Meteor.subscribe("rooms");
Meteor.subscribe("currentUser");
Meteor.subscribe("otherUsers");

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Template.body.helpers({
  'inGame': function() {
    /*
    Find out if the current user is in a game
    */
    var room = Rooms.findOne({ players: Meteor.userId() });
    if (room) {
      return room.inGame;
    }

    return false;
  }
});

Template.lobby.events({
  'click .partyMatch': function(event) {
    event.preventDefault();
    Meteor.call("joinRoom");
  },
  'submit .addform': function(event) {
    event.preventDefault();

    var input = $('[name="addfriend"]').val();

		if (input.length > 2 && input.length < USERNAME_MAX_LEN) {
      Meteor.call("addFriend", {
      	username: input
      },
      function(err, res) {
      	if (res) {
          inputError(res);
        }
      });
    } else if (input.length > USERNAME_MAX_LEN) {
      inputError("The name is too long");
    } else {
    	inputError("The name is too short");
    }
  }
});

Template.lobby.helpers({
  getRoomHost: function() {
  /*
  Return the host of the current room
  */
  var room = Rooms.findOne({ players: Meteor.userId() });
  return {
      username: Meteor.users.findOne(room.players[0]).username  //gets username for the room's host
    }
  },

  getRoomMembers: function() {
    /*
    Return players in a room except the host
    */
    var room = Rooms.findOne({ players: Meteor.userId() });
    var lobbyMembers = [];

    // loop through each member and only keep necessary data to add players to rooms
    room.players.forEach(function(playerId, index) {
      if (index > 0) { //Skip the first player --> the host
        lobbyMembers.push(Meteor.users.findOne(playerId));
      }
    });

    lobbyMembers = lobbyMembers.map(function(player) {
      // loop through each member and only keep necessary data
      var member = {};
      //NOTE: Maybe return rating for each member too? --> Also add this to getRoomHost in that case
      member.username = player.username;
      return member;
    });
    return lobbyMembers;
  },

  userIsOnline: function() {
    /*
    Check if the current user in the Blaze-context is online.
    Might be unclear but it might make sense when looking at how it's used in the lobby-template
    */
    return this.status.online;
  },

  getFriends: function() {
    /*
    Find and return info about friends
    */

    var friends = Meteor.users.find({
      _id: {
        $in: Meteor.user().profile.friends  // the friendlist
      }
    },
    {
      fields: {
        username: 1,
        'profile.rating': 1,
        'status.online': 1
      }
    })
    .fetch()
    .sort(function(a, b) {   // Highest rating first (descending)
      return b.profile.rating - a.profile.rating;
    });

    return friends;
  },

  userIsInRoom: function() {
    if (Rooms.findOne({ players: Meteor.userId() })) {
      return true;
    }
    return false;
  }
});


//------------------------------ GENERAL HELPERS -------------------------------

function inputError(msg) {
  // Alert users about errors
  alert(msg);
}
