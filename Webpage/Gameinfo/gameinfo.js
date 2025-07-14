const imageTypes = ["png", "jpg"]

let lastGracePeriod = false
let lastHomePlayerNames = []
let lastAwayPlayerNames = []

const compareArrays = (a, b) =>
    a.length === b.length &&
    a.every((element, index) => element === b[index]);

// This is the main loop
async function updateOverlay() {
    const camera_id = "dennssen.overlayInfo";

    try {
        const cameraConfigResponse = await fetch(`http://localhost:5420/cameras/${camera_id}/config`);

        if (!cameraConfigResponse.ok) {
            return
        }

        const cameraConfig = await cameraConfigResponse.json();

        const statsInfo = cameraConfig.statsInfo;
        const extraArenaInfo = cameraConfig.extraArenaInfo;
        const slot_id = cameraConfig.gamemodeSlotId;

        const gamemodeResponse = await fetch(`http://localhost:5420/state/gamemodes/${slot_id}`)

        if (!gamemodeResponse.ok) {
            return
        }

        const gamemode = await gamemodeResponse.json()

        setTeamColors(gamemode)
        if (!lastGracePeriod && extraArenaInfo.isGracePeriod) {
            setGoalboard(extraArenaInfo, true)
        } else if (lastGracePeriod && !extraArenaInfo.isGracePeriod) {
            setGoalboard(extraArenaInfo, false)
        }
        setTeamPlayers(extraArenaInfo)
        setFollowedPlayer(extraArenaInfo, statsInfo)
        lastGracePeriod = extraArenaInfo.isGracePeriod
    } catch (error) {
        console.log(error)
    }
}

setInterval(updateOverlay, 250)

// By "Goalboard" I mean the little box containing info about the current goal.
function setGoalboard(extraArenaInfo, activate) {
    const goalboardElement = document.getElementById("goalboard")
    if (activate) {
        const colorElement = document.getElementById("goalboard-color")
        colorElement.setAttribute("stop-color", `var(--${extraArenaInfo.lastShotInfo.team}Color)`)
        goalboardElement.classList.remove("animate__fadeOutDownBig")
        goalboardElement.classList.add("animate__fadeInUpBig")

        const shooterElement = document.getElementById("goalboard-shooter")
        const assisterElement = document.getElementById("goalboard-assister")
        const shotSpeedElement = document.getElementById("goalboard-shot-speed")
        const shotDistanceElement = document.getElementById("goalboard-shot-distance")

        let shooter = extraArenaInfo.lastShotInfo.shooter
        if (shooter === "") {
            shooter = "Unknown"
        }
        const assister = extraArenaInfo.lastShotInfo.assister
        const shotSpeed = Math.floor(extraArenaInfo.lastShotInfo.shotSpeed * 10) / 10
        const shotDistance = Math.floor(extraArenaInfo.lastShotInfo.shotDistanceMeters * 10) / 10

        updateSVGText(shooterElement, shooter)
        if (assister !== "") {
            updateSVGText(assisterElement, `Assisted By: ${assister}`)
        } else {
            assisterElement.innerHTML = ""
        }

        shotSpeedElement.innerHTML = `${shotSpeed}m/s`
        shotDistanceElement.innerHTML = `${shotDistance}m`
    } else {
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

function setTeamPlayers(extraArenaInfo) {
    const homePlayerNames = extraArenaInfo.home.players
    const awayPlayerNames = extraArenaInfo.away.players

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
function setFollowedPlayer(extraArenaInfo, statsInfo) {
    const followedPlayerName = extraArenaInfo.followedPlayer

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

    const isHomePlayer = typeof (extraArenaInfo.home.players.find((element) => element == followedPlayerName)) !== "undefined"

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

        let playerStats = statsInfo.home[followedPlayerName]

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

        let playerStats = statsInfo.away[followedPlayerName]

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

// Used to resize the font size of text content to fit it's container.
function fitTextInSVG(text, maxWidth, maxFontSize, newContent = "") {
    if (newContent !== "") {
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
