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
        Meteor.call('joinRoom', Rooms.findOne()._id);
      }
    } else {
      Meteor.call('addRoom');
    }
    Session.set("inGame", true);
  }
});
