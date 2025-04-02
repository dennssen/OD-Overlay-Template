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

function updateWebiste(data) {
    playerNames(data)
    score(data)
    color(data)
    followed(data)
}

function playerNames(data) {
    let homePlayersElement = document.getElementById("team1-players")
    let homeInnerHtml = ""
    for (let i = 0; i < data.arenaInfo.home.players.length; i++) {
        const playerName = data.arenaInfo.home.players[i];
        homeInnerHtml += `<div class="player-name"><p>${playerName}</p></div>`
    }
    homePlayersElement.innerHTML = homeInnerHtml

    let awayPlayersElement = document.getElementById("team2-players")
    let awayInnerHtml = ""
    for (let i = 0; i < data.arenaInfo.away.players.length; i++) {
        const playerName = data.arenaInfo.away.players[i];
        awayInnerHtml += `<div class="player-name"><p>${playerName}</p></div>`
    }
    awayPlayersElement.innerHTML = awayInnerHtml
}

function score(data) {
    let homeScore = document.getElementById("team1-score")
    let awayScore = document.getElementById("team2-score")
    homeScore.innerHTML = data.arenaInfo.home.score
    awayScore.innerHTML = data.arenaInfo.away.score
}

function color(data) {

}

function followed(data) {

}