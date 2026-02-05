let forceFullOverlay = true;
const imageTypes = ["png", "jpg"]

let lastGracePeriod = false;
let gracePeriodStartTime = 0;
let goalboardMaxDuration = 7;
let isGoalboardActive = false;
let lastHomePlayerNames = [];
let lastAwayPlayerNames = [];

const compareArrays = (a, b) => {
    return a.length === b.length && a.every((element, index) => element === b[index]);
}

const ws = new WebSocket("ws://localhost:8080");

let currentGamemodeId = "";

function setSelectedGamemode(gamemodeId) {
    if (gamemodeId !== currentGamemodeId) {
        ws.send(JSON.stringify({
            action: "setSubscribedGamemode",
            slotId: gamemodeId
        }));
    }

    currentGamemodeId = gamemodeId;
}

ws.onopen = () => console.log("Connected!");
// This is our main loop
ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    let cameraApi = null;
    let gamemode = null;

    if (data.cameraApi !== null) {
        cameraApi = data.cameraApi;
        setSelectedGamemode(data.cameraApi.gamemodeId);
    }

    if (data.selectedGamemode !== null) {
        gamemode = data.selectedGamemode;
    }

    if (cameraApi == null || gamemode == null) {
        return;
    }

    setTeamColors(gamemode);
    if (!lastGracePeriod && cameraApi.isGracePeriod) {
        setGoalboard(cameraApi, gamemode, true)
    } else if (lastGracePeriod && (!cameraApi.isGracePeriod || gamemode.timeSeconds < gracePeriodStartTime - goalboardMaxDuration)) {
        setGoalboard(cameraApi, gamemode, false)
    }
    setTeamPlayers(cameraApi);
    setFollowedPlayer(cameraApi);
    lastGracePeriod = cameraApi.isGracePeriod
}

// By "Goalboard" I mean the little box containing info about the current goal.
function setGoalboard(cameraApi, gamemode, activate) {
    if (isGoalboardActive === activate) {
        return;
    }

    const goalboardElement = document.getElementById("goalboard")
    if (activate) {
        isGoalboardActive = true
        gracePeriodStartTime = gamemode.timeSeconds
        const colorElement = document.getElementById("goalboard-color")
        const teamName = getTeamNameByIndex(cameraApi.lastShotInfo.team);

        colorElement.setAttribute("stop-color", `var(--${teamName}Color)`)
        goalboardElement.classList.remove("animate__fadeOutDownBig")
        goalboardElement.classList.add("animate__fadeInUpBig")

        const shooterElement = document.getElementById("goalboard-shooter")
        const assisterElement = document.getElementById("goalboard-assister")
        const shotSpeedElement = document.getElementById("goalboard-shot-speed")
        const shotDistanceElement = document.getElementById("goalboard-shot-distance")

        let shooter = cameraApi.lastShotInfo.shooter
        if (shooter === "") {
            shooter = "Unknown"
        }
        const assister = cameraApi.lastShotInfo.assister
        const shotSpeed = Math.floor(cameraApi.lastShotInfo.shotSpeed * 10) / 10
        const shotDistance = Math.floor(cameraApi.lastShotInfo.shotDistanceMeters * 10) / 10

        updateSVGText(shooterElement, shooter)
        if (assister !== "") {
            updateSVGText(assisterElement, `Assisted By: ${assister}`)
        } else {
            assisterElement.innerHTML = ""
        }

        shotSpeedElement.innerHTML = `${shotSpeed}m/s`
        shotDistanceElement.innerHTML = `${shotDistance}m`
    } else {
        isGoalboardActive = false
        goalboardElement.classList.remove("animate__fadeInUpBig")
        goalboardElement.classList.add("animate__fadeOutDownBig")
    }
}

function setTeamColors(gamemode) {
    const root = document.querySelector(":root")

    const homeColor = gamemode.teams[0].teamColor.primary
    const awayColor = gamemode.teams[1].teamColor.primary

    root.style.setProperty("--homeColor", `rgba(${homeColor.r}, ${homeColor.g}, ${homeColor.b}, ${homeColor.a})`)
    root.style.setProperty("--awayColor", `rgba(${awayColor.r}, ${awayColor.g}, ${awayColor.b}, ${awayColor.a})`)
}

function setTeamPlayers(cameraApi) {
    const homePlayerNames = Object.keys(cameraApi.home.players);
    const awayPlayerNames = Object.keys(cameraApi.away.players);

    if (!compareArrays(homePlayerNames, lastHomePlayerNames)) {
        const homePlayerContainer = document.getElementById("home-players")
        homePlayerContainer.innerHTML = ""

        for (let i = 0; i < homePlayerNames.length; i++) {
            const homePlayerName = homePlayerNames[i];
            const playerNameHTML = `<div class="player-name animate__animated animate__fadeInLeft">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 164 49">
                            <path class="player-name-home-color" fill="#070707" stroke-width="2"
                                d="M152 1a11 11 0 0 1 11 11v25a11 11 0 0 1-11 11H12A11 11 0 0 1 1 37V12A11 11 0 0 1 12 1h140Z" />
                            <text id="name-${homePlayerName}" class="fit" X="50%" Y="50%"></text>
                        </svg>
                    </div>`
            homePlayerContainer.innerHTML += playerNameHTML

            const nameTextElement = document.getElementById(`name-${homePlayerName}`)
            updateSVGText(nameTextElement, homePlayerName)
        }
    }

    if (!compareArrays(awayPlayerNames, lastAwayPlayerNames)) {
        const awayPlayerContainer = document.getElementById("away-players")
        awayPlayerContainer.innerHTML = ""

        for (let i = 0; i < awayPlayerNames.length; i++) {
            const awayPlayerName = awayPlayerNames[i];
            const playerNameHTML = `<div class="player-name animate__animated animate__fadeInRight">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 164 49">
                        <path class="player-name-away-color" fill="#070707" stroke-width="2"
                            d="M152 1a11 11 0 0 1 11 11v25a11 11 0 0 1-11 11H12A11 11 0 0 1 1 37V12A11 11 0 0 1 12 1h140Z" />
                        <text id="name-${awayPlayerName}" class="fit" X="50%" Y="50%"></text>
                    </svg>
                </div>`
            awayPlayerContainer.innerHTML += playerNameHTML

            const nameTextElement = document.getElementById(`name-${awayPlayerName}`)
            updateSVGText(nameTextElement, awayPlayerName)
        }
    }

    lastHomePlayerNames = homePlayerNames
    lastAwayPlayerNames = awayPlayerNames
}

// Check if a player is followed, if so, show info about the player in their respective corner
function setFollowedPlayer(cameraApi) {
    const followedPlayerName = cameraApi.followedPlayer

    if (followedPlayerName === "") {
        const awayStatsNameElement = document.getElementById("away-stats-name")
        if (awayStatsNameElement.innerHTML !== "") {
            awayStatsNameElement.innerHTML = ""
            const container = awayStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeInUp")
            container.classList.add("animate__fadeOutDown")
        }

        const homeStatsNameElement = document.getElementById("home-stats-name")
        if (homeStatsNameElement.innerHTML !== "") {
            homeStatsNameElement.innerHTML = ""
            const container = homeStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeInUp")
            container.classList.add("animate__fadeOutDown")
        }

        return;
    }

    const isHomePlayer = typeof (cameraApi.home.players[followedPlayerName]) !== "undefined"

    if (isHomePlayer) {
        const awayStatsNameElement = document.getElementById("away-stats-name")
        if (awayStatsNameElement.innerHTML !== "") {
            awayStatsNameElement.innerHTML = ""
            const container = awayStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeInUp")
            container.classList.add("animate__fadeOutDown")
        }

        const homeStatsNameElement = document.getElementById("home-stats-name")
        if (homeStatsNameElement.innerHTML === "") {
            const container = homeStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeOutDown")
            container.classList.add("animate__fadeInUp")
        }
        updateSVGText(homeStatsNameElement, followedPlayerName)

        const goalsStat = document.getElementById("home-stats-goals")
        const assistsStats = document.getElementById("home-stats-assists")
        const savesStats = document.getElementById("home-stats-saves")

        let playerStats = cameraApi.home.players[followedPlayerName]

        if (typeof (playerStats) === "undefined") {
            playerStats = {
                goals: 0,
                assists: 0,
                saves: 0
            }
        }

        goalsStat.innerHTML = `Goals: ${playerStats.goals}`
        assistsStats.innerHTML = `Assists: ${playerStats.assists}`
        savesStats.innerHTML = `Saves: ${playerStats.saves}`
    }
    else {
        const homeStatsNameElement = document.getElementById("home-stats-name")
        if (homeStatsNameElement.innerHTML !== "") {
            homeStatsNameElement.innerHTML = ""
            const container = homeStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeInUp")
            container.classList.add("animate__fadeOutDown")
        }

        const awayStatsNameElement = document.getElementById("away-stats-name")
        if (awayStatsNameElement.innerHTML === "") {
            const container = awayStatsNameElement.parentElement.parentElement
            container.classList.remove("animate__fadeOutDown")
            container.classList.add("animate__fadeInUp")
        }
        updateSVGText(awayStatsNameElement, followedPlayerName)

        const goalsStat = document.getElementById("away-stats-goals")
        const assistsStats = document.getElementById("away-stats-assists")
        const savesStats = document.getElementById("away-stats-saves")

        let playerStats = cameraApi.away.players[followedPlayerName]

        if (typeof (playerStats) === "undefined") {
            playerStats = {
                goals: 0,
                assists: 0,
                saves: 0
            }
        }

        goalsStat.innerHTML = `Goals: ${playerStats.goals}`
        assistsStats.innerHTML = `Assists: ${playerStats.assists}`
        savesStats.innerHTML = `Saves: ${playerStats.saves}`
    }
}

function getTeamNameByIndex(teamIndex) {
    if (teamIndex == 0) {
        return "home";
    } else if (teamIndex == 1) {
        return "away";
    } else {
        return "";
    }
}

// Used to resize the font size of text content to fit it's container.
function fitTextInSVG(text, maxWidth, maxFontSize, newContent = null) {
    if (newContent !== null) {
        text.innerHTML = newContent;
    }

    if (typeof maxFontSize === "undefined") {
        maxFontSize = 30;
    }

    let fontSize = maxFontSize;
    text.setAttribute("font-size", fontSize);

    while (text.getBBox().width > maxWidth && fontSize > 1) {
        fontSize -= 1;
        text.setAttribute("font-size", fontSize);
    }
}

// This is a helper function that makes sure the new text content will fit inside it's container.
function updateSVGText(text, newContent) {
    const svg = text.parentElement;
    const maxWidth = text.dataset.maxWidth || svg.viewBox.baseVal.width;
    const padding = text.dataset.padding || 50
    const maxFontSize = text.dataset.maxFontSize;
    fitTextInSVG(text, maxWidth - padding, maxFontSize, newContent);
}

function updateAllSVGText() {
    const fitTexts = document.querySelectorAll(".fit")

    for (let i = 0; i < fitTexts.length; i++) {
        const text = fitTexts[i];
        const svg = text.parentElement;
        const maxWidth = text.dataset.maxWidth || svg.viewBox.baseVal.width;
        const padding = text.dataset.padding || 50
        const maxFontSize = text.dataset.maxFontSize;
        fitTextInSVG(text, maxWidth - padding, maxFontSize);
    }
}

// Function to check if image exists
function setImageWithFallback(imgElement, url) {
    const testImage = new Image();
    testImage.onload = function () {
        // Image exists, set the URL
        imgElement.setAttribute("href", url);
    };
    testImage.onerror = function () {
        // Image doesn't exist, clear or set to empty
        imgElement.removeAttribute("href");
    };
    testImage.src = url;
}

updateAllSVGText();
