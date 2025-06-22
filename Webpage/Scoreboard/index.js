async function updateOverlay() {
    const camera_id = "dennssen.overlayInfo";

    try {
        const cameraConfigResponse = await fetch(`http://localhost:5420/cameras/${camera_id}/config`);

        if (!cameraConfigResponse.ok) {
            throw new Error(`Response status: ${cameraConfigResponse.status}`);
        }

        const cameraConfig = await cameraConfigResponse.json();

        const statsInfo = cameraConfig.statsInfo;
        const extraArenaInfo = cameraConfig.extraArenaInfo;
        const slot_id = cameraConfig.gamemodeSlotId;

        const gamemodeResponse = await fetch(`http://localhost:5420/state/gamemodes/${slot_id}`)

        if (!gamemodeResponse.ok) {
            throw new Error(`Response status: ${gamemodeResponse.status}`);
        }

        const gamemode = await gamemodeResponse.json()

        setTeamColors(gamemode)
        setScoreboardInfo(gamemode, extraArenaInfo)
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
    const currentTime = document.getElementById("current-time")
    const actionTimer = document.getElementById("action-timer")

    homePoints.innerHTML = gamemode.teams[0].score
    awayPoints.innerHTML = gamemode.teams[1].score

    const homeRoundsWon = gamemode.teams[0].roundsWon
    const awayRoundsWon = gamemode.teams[1].roundsWon
    const bestOfRounds = (extraArenaInfo.bestOf + 1) / 2

    homeRounds.innerHTML = `(${homeRoundsWon}/${bestOfRounds})`
    awayRounds.innerHTML = `(${awayRoundsWon}/${bestOfRounds})`

    currentRound.innerHTML = `Round ${Math.min(homeRoundsWon + awayRoundsWon + 1, extraArenaInfo.bestOf)}`
    currentTime.innerHTML = convertSecondsToTime(gamemode.timeSeconds)

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

function fitTextInSVG(text, maxWidth, maxFontSize, newContent = "") {
    if (newContent !== "") {
        text.textContent = newContent;
    }

    if (typeof maxFontSize === "undefined") {
        maxFontSize = 30;
    }

    let fontSize = maxFontSize; // Start with a large size
    text.setAttribute("font-size", fontSize);

    // Shrink text until it fits
    while (text.getBBox().width > maxWidth && fontSize > 1) {
        fontSize -= 1;
        text.setAttribute("font-size", fontSize);
    }
}

function convertSecondsToTime(totalSeconds) {
    // Calculate minutes
    const minutes = Math.floor(totalSeconds / 60);

    // Calculate remaining seconds after extracting minutes
    const remainingSeconds = totalSeconds % 60;

    // Extract whole seconds from remainingSeconds
    const seconds = Math.floor(remainingSeconds);

    // Calculate milliseconds from the fractional part of remainingSeconds
    const milliseconds = Math.round((remainingSeconds - seconds) * 1000);

    const depad = (n) => n > 100 ? Math.floor(n / 10) : n;
    const pad = (n) => n < 10 ? `0${n}` : n;

    return `${pad(minutes)}:${pad(seconds)}.${pad(depad(milliseconds))}`
}

// Example usage:
const fitTexts = document.querySelectorAll(".fit")

for (let i = 0; i < fitTexts.length; i++) {
    const text = fitTexts[i];
    const svg = text.parentElement;
    const maxWidth = text.dataset.maxWidth || svg.viewBox.baseVal.width;
    console.log(maxWidth)
    const maxFontSize = text.dataset.maxFontSize;
    console.log(maxFontSize)
    fitTextInSVG(text, maxWidth - 50, maxFontSize);
}