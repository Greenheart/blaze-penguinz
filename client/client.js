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
    Session.set("inGame", true);
  }
});
