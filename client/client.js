Meteor.subscribe('rooms');
Meteor.subscribe('users');

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});

Session.setDefault("inGame", false);


Template.body.helpers({
  'inGame': function () {
    return Session.get("inGame");
  }
});

Template.lobby.events({
  'click #play': function(event) {
    event.preventDefault();
    if (Rooms.findOne()){
      if (Rooms.findOne({ players: { $nin: [Meteor.userId()]} })) {
        Meteor.call('joinRoom', Rooms.findOne()._id, function() {
          // callback when room is joined
          startRoomUpdateHandler();
        });
      }
    } else {
      Meteor.call('addRoom', function() {
        // callback when room is created and joined
        startRoomUpdateHandler();
      });
    }
    Session.set("inGame", true);
  }
});

function startRoomUpdateHandler() {
  // observe changes to the room.players where the current player is in
  // to be able to add new players to the game as soon as they join
  console.log("starting roomUpdateHandler");


  var query = Rooms.find({ players: Meteor.userId() });
  var roomUpdateHandler = query.observeChanges({
    changed: function(id, data) {
      if (data.players) {
        // triggered when a player joins
        initNewPlayer();
      }
    }
  });

  //TODO: add code that stop the __roomUpdateHandler__ when the game in a room is finished
  //  HOW? --> simply run this method --> roomUpdateHandler.stop();   // stop observing changes
}
