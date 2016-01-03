Meteor.subscribe("rooms");
Meteor.subscribe("currentUser");
Meteor.subscribe("friends");
Meteor.subscribe('onlineStatus');
Meteor.subscribe("usersInCurrentRoom");

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Template.body.helpers({
  'errorMsg': function() {
    if (Session.get('errorMessage')) {
      return Session.get('errorMessage');
    }
  },
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

Template.body.events({
  'click .acceptError': function(event) {
    Session.set('errorMessage', '');
  }
});

Template.lobby.events({
  'click .playButton': function(event) {
    event.preventDefault();
    var room = Rooms.findOne({ players: Meteor.userId() });

    if (room) {
      if (userIsHost()) {
        Meteor.call("startGame");
      }
    } else {
      Meteor.call("joinRoom");  // try to join a random room
    }

  },
  'click .toggle-button': function() {
    var room = Rooms.findOne({ players: Meteor.userId() });
    if (room && room.players[0] === Meteor.user()._id) {
      // Only allow the room's host to change the room-type
      Meteor.call("toggleRoomType", room._id, function(error, result){
        if(error){
          displayError(err);
          return;
        } else {  // successful change, update UI

          var room = Rooms.findOne({ players: Meteor.userId() });
          if (room) {
            if (room.isPublic) {
              $('.room-type').text("Public");
              $('.toggle-button').removeClass('toggle-button-selected');
            } else {
              $('.room-type').text("Invite-only");
              $('.toggle-button').addClass('toggle-button-selected');
            }
          }
        }
      });
    }
  },
  'submit .addform': function(event) {
    event.preventDefault();

    var input = $('[name="addfriend"]').val();
    $('[name="addfriend"]').val("");

    if (input === Meteor.user().username) {
      displayError("You can't add yourself");
      return;
    }
    var user = Meteor.users.findOne({username: input});
    if (user && Meteor.user().profile.friends.indexOf(user._id) > -1) {
      displayError("You're already friends with "+input+"!");
      return;
    }

    //NOTE: The checks above won't stop usernames that don't exist, but the most performant way
    //      to check for this case is to let the server handle it --> not to publish all usernames
    //      to all clients and let them check if the username exists or not since that would require
    //      a lot of data to be sent back and forth

		if (input.length > 2 && input.length < USERNAME_MAX_LEN) {
      Meteor.call("addFriend", {
      	username: input
      },
      function(err, res) {
      	if (res) {
          displayError(res);
        }
      });
    } else if (input.length > USERNAME_MAX_LEN) {
      displayError("The name is too long");
    } else {
    	displayError("The name is too short");
    }
  },
  'click .invite': function(event) {
    event.preventDefault();

    var room = Rooms.findOne({ players: Meteor.userId() });
    // If the player is not in a room, create a new one on inviting
    if (!room) {
      Meteor.call("createRoom", true);
    }

    Meteor.call("invitePlayer", {
      _id: this._id
    },
    function(err, res) {
      if (res) {
        displayError(res);
      }
    });
  },
  'click .declineInvite': function(event) {
    Meteor.call('removeInvite');
  },
  'click .acceptInvite': function(event) {
    // Call method leaveRoom to leave the current room and delete it if you were the last person to leave
    var room = Rooms.findOne({ players: Meteor.userId() }, {
      fields: {
        players: 1
      }
    });
    Meteor.call('leaveRoom', room);
    Meteor.call('joinRoom', Meteor.user().profile.invites[0]);
    Meteor.call('removeInvite');
  },
  'click .leaveRoom': function(event) {
    var room = Rooms.findOne({ players: Meteor.userId() }, {
      fields: {
        players: 1
      }
    });
    Meteor.call('leaveRoom', room);
  }
});

Template.lobby.helpers({
  playerInvited: function() {
    if (Meteor.user().profile.invites) {
      return Meteor.users.findOne(Meteor.user().profile.invites[0]).username;
    }
  },

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
      if (a && b) {
        return b.profile.rating - a.profile.rating;
      }
    });

    return friends;
  },

  userIsInRoom: function() {
    var room = Rooms.findOne({ players: Meteor.userId() });
    if (room) {
      Session.set("currentRoomId", room._id);
      return true;
    }
    return false;
  },
  roomIsPublic: function() {
    var room = Rooms.findOne({ players: Meteor.userId() });
    if (room) {
      return room.isPublic;
    }
  },
  userIsRoomHost: function() {
    return userIsHost();
  },
  usersOnlineCount: function() {
   return Meteor.users.find({ "status.online": true }).count();
  }
});


//------------------------------ GENERAL HELPERS -------------------------------

function userIsHost() {
  var room = Rooms.findOne({ players: Meteor.userId() });
  if (room) {
    return room.players[0] === Meteor.userId();
  }
}

function displayError(msg) {
  // Alert users about errors
  Session.set('errorMessage', msg);
}
