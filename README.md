# Blaze Penguinz
A realtime multiplayer arena game built with Meteor and [Phaser](https://www.phaser.io)

![The Lobby View](http://i.imgur.com/DgQL9Tr.png)
The lobby host can toggle the game to be private or public. Players can invite their friends.

## Install the game on your computer

1. Download and install [Meteor](https://www.meteor.com)

2. Download [Blaze Penguinz (zip)](https://github.com/Greenheart/blaze-penguinz/archive/master.zip) and unzip it somewhere you can find it.

3. Open the command prompt **(CMD for Windows / Terminal for Mac)** and navigate to the unzipped blaze-penguinz folder

4. run the command `meteor` to start the game.

5. When you see the message `"App running at http://localhost:XXXX"`, open your web browser and go to the URL in the message **(Or `ctrl`/`cmd`-click)** the link in the message.

## Configure your firewall to enable LAN-play

This process varies from computer to computer, but if you search for `Open a specific port in [Your OS here] firewall` you could probably be able to figure it out.

* Open the game to your local network, open the port of the game for incoming and outgoing TCP and DDP traffic.

Once the port is opened, computers on your local network should be able to connect to the game by

1. Opening an browser
2. connecting to `[Your local IP]:PORT`, for example `http://192.168.0.42:3000` (assuming the game is running on port 3000)

Good luck and have fun!
