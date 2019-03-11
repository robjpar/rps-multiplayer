// Initialize Firebase and create references
var config = {
    apiKey: "AIzaSyB2jwNzvZ6B6v0lNk2nvrItFtgeq8zxUO0",
    authDomain: "rps-game-bb6dc.firebaseapp.com",
    databaseURL: "https://rps-game-bb6dc.firebaseio.com",
    projectId: "rps-game-bb6dc",
    storageBucket: "rps-game-bb6dc.appspot.com",
    messagingSenderId: "1006367288341"
};
firebase.initializeApp(config);
var database = firebase.database();
var connectedRef = database.ref(".info/connected");
var playersRef = database.ref("players"); // the players' queue

// This player info
var thisPlayer = {
    name: "",
    pick: "", // rock, paper, or scissors
    key: "" // a unique key returned by the Firebase
}

// The other player info
var otherPlayer = {
    name: "",
    pick: "", // rock, paper, or scissors
    key: "" // a unique key returned by the Firebase
}

// The players' queue
var allPlayers = [];

// The playing players. Includes this player and the other player
var playingPlayers = [];

// The scoreboard counters
var thisResults = {
    win: 0,
    tie: 0,
    loss: 0
}

// Timer
var time = 0; // seconds
var timerOn = false; // switch the timer on/off
const TIME_OUT = 30; // seconds given before resetting this player if an item not picked

// A round of the RPS game
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

// Add this player to the players' queue stored in the Firebase
connectedRef.on("value", function (snapshot) { // once connected
    if (snapshot.val()) {
        // Add this player to the queue and get the unique reference
        var reference = playersRef.push(thisPlayer);

        // Remember to remove from the queue when disconnected
        reference.onDisconnect().remove();

        // Get the unique key
        var key = reference.key;

        // Update this player info
        thisPlayer.name = "Player-" + key.substring(key.length - 4);
        thisPlayer.key = key;

        // Debugging info
        console.log("this player:");
        console.log(thisPlayer);
    }
});

// Get the players' queue from the Firebase. Ordering by key returns the content in chronological
// order, oldest -> newest; players who joined first -> players who joined later
playersRef.orderByKey().on('value', function (snapshot) { // when any change
    if (snapshot.val()) {
        allPlayers = [];

        snapshot.forEach(function (childSnapshot) {
            // Get the player's key
            var key = childSnapshot.key;

            // Update the player's info
            var name = "Player-" + key.substring(key.length - 4);
            var pick = childSnapshot.val().pick;

            // Add to the local copy of the queue
            allPlayers.push({
                name: name,
                pick: pick,
                key: key
            });
        });

        // Debugging info
        console.log("all players:");
        console.log(allPlayers);

        // Print the queue out to the webpage
        $("#queue-box").empty();
        allPlayers.forEach(function (player) {
            $("#queue-box").append(" <<< " + player.name);
        });
    }
});

// Getting the two players who joined first, who are playing now
playersRef.orderByKey().limitToFirst(2).on('value', function (snapshot) { // when any change
    if (snapshot.val()) {
        playingPlayers = [];

        snapshot.forEach(function (childSnapshot) {
            // Get the player's key
            var key = childSnapshot.key;

            // Update the player's info
            var name = "Player-" + key.substring(key.length - 4);
            var pick = childSnapshot.val().pick;

            // Add to the local copy of the playing players
            playingPlayers.push({
                name: name,
                pick: pick,
                key: key
            });
        });

        // Debugging info
        console.log("playing players:");
        console.log(playingPlayers);

        // If only one player in the queue
        if (playingPlayers.length < 2) {

            // Switch the timer off
            timerOn = false;

            // Debugging info
            console.log("You are waiting for the opponent!");

            // Print out the message of waiting for this player
            $("#info-box").text(`you (${thisPlayer.name}) are waiting for the second player to join`);

            // Disable all buttons
            $("button.item").each(function () {
                $(this).prop("disabled", true);
            });

            // If at least two players in the queue and this player is one of the first two
        } else if (thisPlayer.key === playingPlayers[0].key || thisPlayer.key === playingPlayers[1].key) {
            // Debugging info
            console.log("You are playing!");

            // Updating the local info of the other player with the info that came from the Firebase
            if (thisPlayer.key === playingPlayers[0].key) {

                otherPlayer.name = playingPlayers[1].name;
                otherPlayer.key = playingPlayers[1].key;
                otherPlayer.pick = playingPlayers[1].pick;
            } else {
                otherPlayer.name = playingPlayers[0].name;
                otherPlayer.key = playingPlayers[0].key;
                otherPlayer.pick = playingPlayers[0].pick;
            }

            // Print out the message of playing for this player
            $("#info-box").text(`you (${thisPlayer.name}) are playing against ${otherPlayer.name}`);



            // If this player's pick is not available
            if (thisPlayer.pick === "") {

                // Set the timer
                time = TIME_OUT;
                timerOn = true;

                // Enable all buttons
                $("button.item").each(function () {
                    $(this).prop("disabled", false);
                });

                // If this player's pick is available (a button was clicked)
            } else {
                // Disable all buttons
                $("button.item").each(function () {
                    $(this).prop("disabled", true);
                });

                // Print out the message of waiting for the other player to pick an item
                $("#info-box").text(`you (${thisPlayer.name}) are WAITING for ${otherPlayer.name}'s pick`);
            }

            // If both this player's and other player's picks are available. (If not, the analogous
            // code will be executed below when this player's pick comes as a result of clicking
            // a button)
            if (thisPlayer.pick !== "" && otherPlayer.pick !== "") {
                // Debugging info
                console.log("this player pick: " + thisPlayer.pick);
                console.log("other player pick: " + otherPlayer.pick);

                // Complete the round of the game
                var result = runRPSGame(thisPlayer.pick, otherPlayer.pick);
                thisResults[result] += 1; // result === win, tie, or loss

                // Debugging info
                console.log("this player results:");
                console.log(thisResults);

                // Print the result out to the scoreboard
                $("#wins-box").text(thisResults.win);
                $("#ties-box").text(thisResults.tie);
                $("#losses-box").text(thisResults.loss);

                // Print the result out to the players' history
                if (result === "win") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] WON against ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                } else if (result === "tie") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] TIED with ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                } else if (result === "loss") {
                    $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] LOST to ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

                }

                // Clear the local and remote pick variables before the next round
                thisPlayer.pick = "";
                otherPlayer.pick = "";
                var updates = {};
                updates[thisPlayer.key + "/pick"] = "";
                updates[otherPlayer.key + "/pick"] = "";
                playersRef.update(updates);
            }

            // If this player is not one of the first two players in the queue
        } else {
            // Turn the timer off
            timerOn = false;

            // Debugging info
            console.log("You are waiting in the queue.");

            // Print out the message of waiting for this player
            $("#info-box").text(`you (${thisPlayer.name}) are waiting in the queue`);

            // Disable all buttons
            $("button.item").each(function () {
                $(this).prop("disabled", true);
            });
        }
    }
});

// Functionality of the buttons for this player
$("button.item").click(function () { // when a button clicked

    // Turn the timer off
    timerOn = false;

    // Disable all buttons
    $("button.item").each(function () {
        $(this).prop("disabled", true);
    });

    // Print out the message of waiting for the other player to pick an item
    $("#info-box").text(`you (${thisPlayer.name}) are WAITING for ${otherPlayer.name}'s pick`);

    // Get the item picked
    var item = $(this).attr("id"); // item === rock, paper, or scissors

    // Update the pick locally
    thisPlayer.pick = item;

    // Debugging info
    console.log("this player pick: " + thisPlayer.pick);

    // Update the pick in the Firebase
    var update = {};
    update[thisPlayer.key + "/pick"] = thisPlayer.pick;
    playersRef.update(update);

    // If both this player's and other player's picks are available. (If not, the analogous code
    // will be executed above when the other player's pick comes from the Firebase)
    if (thisPlayer.pick !== "" && otherPlayer.pick !== "") {
        // Debugging info
        console.log("this player pick: " + thisPlayer.pick);
        console.log("other player pick: " + otherPlayer.pick);

        // Complete the round of the game 
        var result = runRPSGame(thisPlayer.pick, otherPlayer.pick);
        thisResults[result] += 1; // result === win, tie, or loss

        // Debugging info
        console.log("this player results:");
        console.log(thisResults);

        // Print the result out to the scoreboard
        $("#wins-box").text(thisResults.win);
        $("#ties-box").text(thisResults.tie);
        $("#losses-box").text(thisResults.loss);

        // Print the result to the players' history
        if (result === "win") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] WON against ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        } else if (result === "tie") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] TIED with ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        } else if (result === "loss") {
            $("#history-box").prepend(`<p>you (${thisPlayer.name}) [${thisPlayer.pick}] LOST to ${otherPlayer.name} [${otherPlayer.pick}]</p>`);

        }

        // Clear the local and remote pick variables before the next round 
        thisPlayer.pick = "";
        otherPlayer.pick = "";
        var updates = {};
        updates[thisPlayer.key + "/pick"] = "";
        updates[otherPlayer.key + "/pick"] = "";
        playersRef.update(updates);
    }
});

// Set a timer to reset this player if an item not picked. This is meant to avoid the situation when one player
// is blocking accesses to the game by keeping the webpage open but not playing
setInterval(function () {
    time -= 1; // second

    // If a time-out for this player
    if (timerOn && time <= 0) {
        timerOn = false;

        // Print out the message
        $("#timer-box").text("YOUR STATS ARE BEING RESET. MOVING TO THE END OF THE QUEUE AS A NEW PLAYER...");

        // Set a delay before resetting this player so that the above message can be noted
        setTimeout(function () {

            // Reload the current page
            location.reload();

        }, 4000); // four seconds

        // If timer is on
    } else if (timerOn) {
        $("#timer-box").text(`you have ${time} seconds remaining to pick an item`);

        // If timer is off
    } else {
        $("#timer-box").empty();

    }

}, 1000); // one second