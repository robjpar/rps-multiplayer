// Initialize Firebase
var config = {
    apiKey: "AIzaSyB2jwNzvZ6B6v0lNk2nvrItFtgeq8zxUO0",
    authDomain: "rps-game-bb6dc.firebaseapp.com",
    databaseURL: "https://rps-game-bb6dc.firebaseio.com",
    projectId: "rps-game-bb6dc",
    storageBucket: "rps-game-bb6dc.appspot.com",
    messagingSenderId: "1006367288341"
};
firebase.initializeApp(config);

// Create a variable to reference the database.
var database = firebase.database();

var playersRef = database.ref("players");
var connectedRef = database.ref(".info/connected");


var thisPlayer = {
    name: "",
    pick: "", // r, p, s
    key: ""
}

connectedRef.on("value", function (snapshot) {
    if (snapshot.val()) {
        var reference = playersRef.push(thisPlayer);

        reference.onDisconnect().remove();

        var key = reference.key;

        thisPlayer.name = "Player-" + key.substring(key.length - 4);
        thisPlayer.key = key;

        console.log("this player:");
        console.log(thisPlayer);
    }
});


var allPlayers = [];

playersRef.orderByKey().on('value', function (snapshot) {
    if (snapshot.val()) {
        allPlayers = [];

        snapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;

            var name = "Player-" + key.substring(key.length - 4);
            var pick = childSnapshot.val().pick;

            allPlayers.push({
                name: name,
                pick: pick,
                key: key
            });
        });

        console.log("all players:");
        console.log(allPlayers);
    }
});


var playingPlayers = [];

playersRef.orderByKey().limitToFirst(2).on('value', function (snapshot) {
    if (snapshot.val()) {
        playingPlayers = [];

        snapshot.forEach(function (childSnapshot) {
            var key = childSnapshot.key;

            var name = "Player-" + key.substring(key.length - 4);
            var pick = childSnapshot.val().pick;

            playingPlayers.push({
                name: name,
                pick: pick,
                key: key
            });
        });

        console.log("playing players:");
        console.log(playingPlayers);

        if (thisPlayer.key === playingPlayers[0].key || thisPlayer.key === playingPlayers[1].key) {
            console.log("You are playing!");
        } else {
            console.log("You are waiting in the queue");
        }
    }
});