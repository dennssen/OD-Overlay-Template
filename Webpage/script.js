const socket = new WebSocket("ws://localhost:8765")

socket.onopen = () => {
    console.log("Connected to socket")
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data).customData;
        console.log("Received Data: ", data);
        updateWebiste(data);
    } catch (error) {
        console.log("Error Parsing JSON: ", error);
    }
};

socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
};

socket.onclose = () => {
    console.log("WebSocket connection closed");
};

let arenaStartTime;
let currentArenaTime = "00:00";

function updateWebiste(data) {
    teams(data);
    playerNames(data);
    score(data);
    setTime(data);
    color(data);
    followed(data);
}

function teams(data) {
    const homeName = data.arenaInfo.home.name;
    const awayName = data.arenaInfo.away.name;

    const homeImgElement = document.getElementById("home-team-info").getElementsByTagName("img")[0];
    const homePElement = document.getElementById("home-team-info").getElementsByTagName("p")[0];
    const awayImgElement = document.getElementById("away-team-info").getElementsByTagName("img")[0];
    const awayPElement = document.getElementById("away-team-info").getElementsByTagName("p")[0];

    homePElement.innerHTML = homeName;
    awayPElement.innerHTML = awayName;

    let homeSrc = homeName.toLowerCase();
    homeSrc = homeSrc.replace(/ /g, "_");
    let awaySrc = awayName.toLowerCase();
    awaySrc = awaySrc.replace(/ /g, "_");

    homeImgElement.src = `../Assets/Images/${homeSrc}.png`
    awayImgElement.src = `../Assets/Images/${awaySrc}.png`
}

function playerNames(data) {
    let homePlayersElement = document.getElementById("home-players")
    let homeInnerHtml = ""
    for (let i = 0; i < data.arenaInfo.home.players.length; i++) {
        const playerName = data.arenaInfo.home.players[i];
        homeInnerHtml += `<div class="player-name"><p>${playerName}</p></div>`
    }
    homePlayersElement.innerHTML = homeInnerHtml

    let awayPlayersElement = document.getElementById("away-players")
    let awayInnerHtml = ""
    for (let i = 0; i < data.arenaInfo.away.players.length; i++) {
        const playerName = data.arenaInfo.away.players[i];
        awayInnerHtml += `<div class="player-name"><p>${playerName}</p></div>`
    }
    awayPlayersElement.innerHTML = awayInnerHtml
}

function score(data) {
    let homeScore = document.getElementById("home-score")
    let awayScore = document.getElementById("away-score")
    homeScore.innerHTML = data.arenaInfo.home.score
    awayScore.innerHTML = data.arenaInfo.away.score
}

function setTime(data) {
    const time = data.arenaInfo.startTime;
    if (time === "") {
        return;
    }

    const now = new Date();
    const [hours, minutes, seconds] = time.split(":").map(Number);
    const doneTime = new Date();
    doneTime.setHours(hours, minutes + 5, seconds, 0);

    arenaStartTime = doneTime;
}

function color(data) {
    let homeColor = data.arenaInfo.home.color;
    // convert to 255 values
    homeColor.r = homeColor.r * 255;
    homeColor.g = homeColor.g * 255;
    homeColor.b = homeColor.b * 255;

    document.documentElement.style.setProperty("--home-color", `rgb(${homeColor.r}, ${homeColor.g}, ${homeColor.b})`);

    let awayColor = data.arenaInfo.away.color;
    // convert to 255 values
    awayColor.r = awayColor.r * 255;
    awayColor.g = awayColor.g * 255;
    awayColor.b = awayColor.b * 255;

    document.documentElement.style.setProperty("--away-color", `rgb(${awayColor.r}, ${awayColor.g}, ${awayColor.b})`);
}

function followed(data) {
    let followedPlayer = data.arenaInfo.followedPlayer;
    let homePlayers = data.arenaInfo.home.players;
    let awayPlayers = data.arenaInfo.away.players;

    let foundPlayer = false;
    let isHome = false;

    for (let i = 0; i < homePlayers.length; i++) {
        const playerName = homePlayers[i];
        if (followedPlayer == playerName) {
            foundPlayer = true;
            isHome = true;
            break;
        }
    }

    if (!foundPlayer) {
        for (let i = 0; i < awayPlayers.length; i++) {
            const playerName = awayPlayers[i];
            console.log(playerName)
            if (followedPlayer == playerName) {
                foundPlayer = true;
                break;
            }
        }
    }

    let homePlayerBox = document.getElementById("home-stats-box");
    let awayPlayerBox = document.getElementById("away-stats-box");

    if (!foundPlayer) {
        homePlayerBox.style.display = "none";
        awayPlayerBox.style.display = "none";
        console.log("no player")
        return;
    }

    if (isHome) {
        let name = document.getElementById("home-follow-player-name");
        let goals = document.getElementById("home-goals");
        let assists = document.getElementById("home-assists");
        let saves = document.getElementById("home-saves");

        let stats = data.statsInfo.home[followedPlayer]
        console.log(stats)
        if (typeof stats == "undefined") {
            console.log("here")
            stats = {
                goals: 0,
                assists: 0,
                saves: 0
            }
        }

        name.innerHTML = followedPlayer;
        goals.innerHTML = `Goals: ${stats.goals}`;
        assists.innerHTML = `Assists: ${stats.assists}`;
        saves.innerHTML = `Saves: ${stats.saves}`;

        homePlayerBox.style.display = "block";
        awayPlayerBox.style.display = "none";
    }
    else {
        let name = document.getElementById("away-follow-player-name");
        let goals = document.getElementById("away-goals");
        let assists = document.getElementById("away-assists");
        let saves = document.getElementById("away-saves");

        let stats = data.statsInfo.away[followedPlayer];
        console.log(stats)
        if (typeof stats == "undefined") {
            console.log("here")
            stats = {
                goals: 0,
                assists: 0,
                saves: 0
            }
        }

        name.innerHTML = followedPlayer;
        goals.innerHTML = `Goals: ${stats.goals}`;
        assists.innerHTML = `Assists: ${stats.assists}`;
        saves.innerHTML = `Saves: ${stats.saves}`;

        awayPlayerBox.style.display = "block";
        homePlayerBox.style.display = "none";
    }
}

function updateTimer() {
    if (typeof arenaStartTime == "undefined") {
        return;
    }

    const now = new Date();
    if (now >= arenaStartTime) {
        return;
    }

    const diffSeconds = Math.floor((arenaStartTime - now) / 1000);
    const minutesRemaining = Math.floor(diffSeconds / 60);
    const secondsRemaining = diffSeconds % 60;

    currentArenaTime = `${String(minutesRemaining).padStart(2, '0')}:${String(secondsRemaining).padStart(2, '0')}`;

    const gameTime = document.getElementById("game-time")
    gameTime.innerHTML = currentArenaTime;
}

setInterval(updateTimer, 1000);