const imageTypes = ["png", "jpg"]

let lastHomePlayerNames = []
let lastAwayPlayerNames = []

let lastApiUpdate = { time: 0, timestamp: 0, isRunning: false };
let animationId = null;

const compareArrays = (a, b) =>
    a.length === b.length &&
    a.every((element, index) => element === b[index]);

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
        setScoreboardInfo(gamemode, extraArenaInfo)
        setTeamPlayers(extraArenaInfo)
        setFollowedPlayer(extraArenaInfo, statsInfo)
    } catch (error) {
        console.log(error)
    }
}

setInterval(updateOverlay, 250)

function setScoreboardInfo(gamemode, extraArenaInfo) {
    const homePoints = document.getElementById("home-points")
    const awayPoints = document.getElementById("away-points")

    const homeRounds = document.getElementById("home-rounds")
    const awayRounds = document.getElementById("away-rounds")

    const currentRound = document.getElementById("current-round")
    const actionTimer = document.getElementById("action-timer")

    const homeTeamName = document.getElementById("home-team-name")
    const homeTeamLogo = document.getElementById("home-team-image")

    const awayTeamName = document.getElementById("away-team-name")
    const awayTeamLogo = document.getElementById("away-team-image")

    const homeName = extraArenaInfo.home.name
    const awayName = extraArenaInfo.away.name

    updateSVGText(homeTeamName, homeName)
    updateSVGText(awayTeamName, awayName)

    const homeTeamLogoUrl = `../../Assets/Images/${homeName.toLowerCase().replaceAll(" ", "_")}.png`
    setImageWithFallback(homeTeamLogo, homeTeamLogoUrl)

    const awayTeamLogoUrl = `../../Assets/Images/${awayName.toLowerCase().replaceAll(" ", "_")}.png`
    setImageWithFallback(awayTeamLogo, awayTeamLogoUrl)

    homePoints.innerHTML = gamemode.teams[0].score
    awayPoints.innerHTML = gamemode.teams[1].score

    const homeRoundsWon = gamemode.teams[0].roundsWon
    const awayRoundsWon = gamemode.teams[1].roundsWon

    const bestOfRounds = (extraArenaInfo.bestOf + 1) / 2

    homeRounds.innerHTML = `(${homeRoundsWon}/${bestOfRounds})`
    awayRounds.innerHTML = `(${awayRoundsWon}/${bestOfRounds})`

    currentRound.innerHTML = `Round ${Math.min(homeRoundsWon + awayRoundsWon + 1, extraArenaInfo.bestOf)}`
    updateTimer(gamemode.timeSeconds, extraArenaInfo.matchLengthSeconds)

    const actionTimerSeconds = Math.ceil(gamemode.secondaryTimeSeconds)

    if (actionTimerSeconds === 0 && actionTimer.innerHTML != 0) {
        actionTimer.parentElement.classList.remove("animate__fadeInDown")
        actionTimer.parentElement.classList.add("animate__fadeOutUp")
    }
    else if (actionTimerSeconds !== 0 && actionTimer.innerHTML == 0) {
        actionTimer.parentElement.classList.add("animate__fadeInDown")
        actionTimer.parentElement.classList.remove("animate__fadeOutUp")
    }

    actionTimer.innerHTML = actionTimerSeconds
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

        const playerStats = statsInfo.home[followedPlayerName]

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

        const playerStats = statsInfo.away[followedPlayerName]

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

function updateDisplay() {
    const showMs = lastApiUpdate.isRunning;

    const now = Date.now();
    const elapsed = (now - lastApiUpdate.timestamp) / 1000;
    let currentTime = 0;

    if (showMs) {
        currentTime = Math.max(0, lastApiUpdate.time - elapsed);
    }
    else {
        currentTime = lastApiUpdate.time;
    }

    const currentTimeElement = document.getElementById("current-time")
    currentTimeElement.innerHTML = convertSecondsToTime(currentTime, showMs);

    if (currentTime > 0) {
        animationId = requestAnimationFrame(updateDisplay);
    }
}

function updateTimer(newTimeSeconds, matchLengthSeconds) {
    if (animationId) cancelAnimationFrame(animationId);

    const isRunning = newTimeSeconds !== matchLengthSeconds;

    lastApiUpdate = {
        time: newTimeSeconds,
        timestamp: Date.now(),
        isRunning: isRunning
    };

    updateDisplay();
}

function convertSecondsToTime(totalSeconds, showMilliseconds = true) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    const seconds = Math.floor(remainingSeconds);

    let milliseconds = 0;
    if (showMilliseconds) {
        milliseconds = Math.floor((remainingSeconds - seconds) * 100);
    }

    const pad = (n, digits = 2) => n.toString().padStart(digits, '0');

    return showMilliseconds
        ? `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 2)}`
        : `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 2)}`;
}

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
        imgElement.removeAttribute("href"); // or set to a default/empty image
        // Alternative: imgElement.setAttribute("href", "data:image/svg+xml;charset=UTF-8,");
    };
    testImage.src = url;
}

updateAllSVGText();
