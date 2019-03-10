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

// Create a reference the database.
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

        $("#queue-box").empty();
        allPlayers.forEach(function (player) {
            $("#queue-box").append(" <<< " + player.name);
        });
    }
});

var otherPlayer = {
    name: "",
    pick: "", // r, p, s
    key: ""
}

var playingPlayers = [];

// Counters
var thisResults = {
    win: 0,
    tie: 0,
    loss: 0
}

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

        if (playingPlayers.length < 2) {
            console.log("You are waiting for the opponent!");

            $("#info-box").text(`you (${thisPlayer.name}) are waiting for the opponent`);

            $("button.item").each(function () {
                $(this).prop("disabled", true);
            });

        } else if (thisPlayer.key === playingPlayers[0].key || thisPlayer.key === playingPlayers[1].key) {
            console.log("You are playing!");

            if (thisPlayer.key === playingPlayers[0].key) {
                otherPlayer.name = playingPlayers[1].name;
                otherPlayer.key = playingPlayers[1].key;
                otherPlayer.pick = playingPlayers[1].pick;

            } else {
                otherPlayer.name = playingPlayers[0].name;
                otherPlayer.key = playingPlayers[0].key;
                otherPlayer.pick = playingPlayers[0].pick;

            }

            $("#info-box").text(`you (${thisPlayer.name}) are playing against ${otherPlayer.name}`);

            $("button.item").each(function () {
                $(this).prop("disabled", false);
            });

            if (thisPlayer.pick !== "" && otherPlayer.pick !== "") {
                console.log("this player pick: " + thisPlayer.pick);
                console.log("other player pick: " + otherPlayer.pick);

                var result = runRPSGame(thisPlayer.pick, otherPlayer.pick);
                thisResults[result] += 1;

                console.log("this player results:");
                console.log(thisResults);

                $("#wins-box").text(thisResults.win);
                $("#ties-box").text(thisResults.tie);
                $("#losses-box").text(thisResults.loss);

                if (result === "win") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] WON against ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                } else if (result === "tie") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] TIED with ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                } else if (result === "loss") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] LOST to ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                }

                thisPlayer.pick = "";
                otherPlayer.pick = "";
                var updates = {};
                updates[thisPlayer.key + "/pick"] = "";
                updates[otherPlayer.key + "/pick"] = "";
                playersRef.update(updates);

            }

        } else {
            console.log("You are waiting in the queue.");

            $("#info-box").text(`you (${thisPlayer.name}) are waiting in the queue`);

            $("button.item").each(function () {
                $(this).prop("disabled", true);
            });
        }
    }
});

$("button.item").click(function () {
    var item = $(this).attr("id");

    thisPlayer.pick = item;

    console.log("this player pick: " + thisPlayer.pick);

    var update = {};
    update[thisPlayer.key + "/pick"] = thisPlayer.pick;

    playersRef.update(update);

    $("button.item").each(function () {
        $(this).prop("disabled", true);

    });

    $("#info-box").text(`you (${thisPlayer.name}) are WAITING for ${otherPlayer.name}'s pick`);

    if (thisPlayer.pick !== "" && otherPlayer.pick !== "") {
        console.log("this player pick: " + thisPlayer.pick);
        console.log("other player pick: " + otherPlayer.pick);

        var result = runRPSGame(thisPlayer.pick, otherPlayer.pick);
        thisResults[result] += 1;

        console.log("this player results:");
        console.log(thisResults);

        $("#wins-box").text(thisResults.win);
        $("#ties-box").text(thisResults.tie);
        $("#losses-box").text(thisResults.loss);

        if (result === "win") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] WON against ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        } else if (result === "tie") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] TIED with ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        } else if (result === "loss") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] LOST to ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        }

        thisPlayer.pick = "";
        otherPlayer.pick = "";
        var updates = {};
        updates[thisPlayer.key + "/pick"] = "";
        updates[otherPlayer.key + "/pick"] = "";
        playersRef.update(updates);

    }
});

function runRPSGame(thisPick, otherPick) {
    if (thisPick === otherPick) {
        return "tie";
    }

    if (thisPick === 'rock' && otherPick === 'scissors') {
        return "win";
    }

    if (thisPick === 'scissors' && otherPick === 'rock') {
        return "loss";
    }

    if (thisPick === 'rock' && otherPick === 'paper') {
        return "loss";
    }

    if (thisPick === 'paper' && otherPick === 'rock') {
        return "win";
    }

    if (thisPick === 'paper' && otherPick === 'scissors') {
        return "loss";
    }

    if (thisPick === 'scissors' && otherPick === 'paper') {
        return "win";
    }
}