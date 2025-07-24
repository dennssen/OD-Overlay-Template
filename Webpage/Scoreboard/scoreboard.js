let forceFullOverlay = false;
let lastBestOf = 0;

let lastApiUpdate = { time: 0, timestamp: 0, isRunning: false };
let animationId = null;

// this is our main loop
async function updateOverlay() {
    const camera_id = "dennssen.overlayInfo";

    try {
        const cameraConfigResponse = await fetch(`http://localhost:5420/cameras/${camera_id}/config`);

        if (!cameraConfigResponse.ok) {
            return
        }

        const cameraConfig = await cameraConfigResponse.json();

        const extraArenaInfo = cameraConfig.extraArenaInfo;
        const slot_id = cameraConfig.gamemodeSlotId;

        const gamemodeResponse = await fetch(`http://localhost:5420/state/gamemodes/${slot_id}`)

        if (!gamemodeResponse.ok) {
            return
        }

        const gamemode = await gamemodeResponse.json()

        setBestOfSVG(extraArenaInfo)
        setTeamColors(gamemode)
        setScoreboardInfo(gamemode, extraArenaInfo)
    } catch (error) {
        console.log(error)
    }
}

setInterval(updateOverlay, 250)

function setTeamColors(gamemode) {
    const root = document.querySelector(":root")

    const homeColor = gamemode.teams[0].teamColor.primary
    const awayColor = gamemode.teams[1].teamColor.primary

    root.style.setProperty("--homeColor", `rgba(${homeColor.r}, ${homeColor.g}, ${homeColor.b}, ${homeColor.a})`)
    root.style.setProperty("--awayColor", `rgba(${awayColor.r}, ${awayColor.g}, ${awayColor.b}, ${awayColor.a})`)
}

function setBestOfSVG(extraArenaInfo) {
    // We only want to run this function if the amount of rounds being played have changed
    if (lastBestOf === extraArenaInfo.bestOf) {
        return;
    }

    const bestOfSVG = document.getElementById("bestOf")
    if (bestOfSVG !== null) {
        bestOfSVG.remove()
    }

    // Here we set the correct svg. Because I'm unfamiliar with SVGs i opted for making pre-existing SVGs and picking the correct one.
    // But there is porbably a better way to do this if you're able to make your own SVGs in code.
    const scoreboardHTML = document.getElementsByClassName("scoreboard")[0]
    if (extraArenaInfo.bestOf === 3) {
        scoreboardHTML.innerHTML += `<svg id="bestOf" viewBox="0 0 188 59" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path id="r1-home" d="M92.9629 58.5H1.03711L47 0.801758L92.9629 58.5Z" stroke="black" />
            <path id="r2" d="M48.0371 0.5L139.963 0.5L94 58.1982L48.0371 0.5Z" stroke="black" />
            <path id="r1-away" d="M186.963 58.5H95.0371L141 0.801758L186.963 58.5Z" stroke="black" />
        </svg>`
    } else if (extraArenaInfo.bestOf === 5) {
        scoreboardHTML.innerHTML += `<svg id="bestOf" viewBox="0 0 188 59" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path id="r1-home" d="M62.2822 58.5H0.833984L31.5576 1.05957L62.2822 58.5Z" stroke="black" />
            <path id="r2-home" d="M32.0551 0.5L93.5034 0.5L62.7798 57.9404L32.0551 0.5Z" stroke="black" />
            <path id="r3" d="M124.724 58.5H63.2757L93.9994 1.05957L124.724 58.5Z" stroke="black" />
            <path id="r2-away" d="M94.4969 0.5L155.945 0.5L125.221 57.9404L94.4969 0.5Z" stroke="black" />
            <path id="r1-away" d="M187.166 58.5H125.717L156.441 1.05957L187.166 58.5Z" stroke="black" />
        </svg>`
    } else if (extraArenaInfo.bestOf === 7) {
        scoreboardHTML.innerHTML += `<svg id="bestOf" viewBox="0 0 185 59" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path id="r1-home" d="M23.5 0L47 59H0L23.5 0Z" stroke="black" />
            <path id="r2-home" d="M46.5 60L23 1L70 1L46.5 60Z" stroke="black" />
            <path id="r3-home" d="M69.5 0L93 59H46L69.5 0Z" stroke="black" />
            <path id="r4" d="M92.5 60L69 1L116 1L92.5 60Z" stroke="black" />
            <path id="r3-away" d="M115.5 0L139 59H92L115.5 0Z" stroke="black" />
            <path id="r2-away" d="M138.5 60L115 1L162 1L138.5 60Z" stroke="black" />
            <path id="r1-away" d="M161.5 0L185 59H138L161.5 0Z" stroke="black" />
        </svg>`
    }

    lastBestOf = extraArenaInfo.bestOf
}

function setScoreboardInfo(gamemode, extraArenaInfo) {
    const homePoints = document.getElementById("home-points")
    const awayPoints = document.getElementById("away-points")

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

    const homeTeamLogoUrl = `Assets/Images/${homeName.toLowerCase().replaceAll(" ", "_")}.png`
    setImageWithFallback(homeTeamLogo, homeTeamLogoUrl)

    const awayTeamLogoUrl = `Assets/Images/${awayName.toLowerCase().replaceAll(" ", "_")}.png`
    setImageWithFallback(awayTeamLogo, awayTeamLogoUrl)

    homePoints.innerHTML = gamemode.teams[0].score
    awayPoints.innerHTML = gamemode.teams[1].score

    const homeRoundsWon = gamemode.teams[0].roundsWon
    const awayRoundsWon = gamemode.teams[1].roundsWon

    setRoundsWon(extraArenaInfo)

    currentRound.innerHTML = `Round ${Math.min(homeRoundsWon + awayRoundsWon + 1, extraArenaInfo.bestOf)}`
    updateTimer(gamemode.timeSeconds, extraArenaInfo.matchLengthSeconds, extraArenaInfo.isOvertime)

    let actionTimerSeconds = Math.ceil(gamemode.secondaryTimeSeconds)

    if (forceFullOverlay) {
        actionTimerSeconds = 15
    }

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

// Recolors the SVG that is set by "setBestOfSVG()" to show who has won what rounds
// If the SVG was created in code this could probably be done a better way
function setRoundsWon(extraArenaInfo) {
    if (extraArenaInfo.bestOf < 3) {
        // If the amount of rounds is less than 3 the SVG doesn't exist
        return;
    }

    let homeRoundsWon = 0;
    let awayRoundsWon = 0;

    const rounds = extraArenaInfo.rounds

    for (let i = 0; i < rounds.length; i++) {
        const round = rounds[i];

        if (round.home.score > round.away.score) {
            homeRoundsWon++;
        } else if (round.away.score > round.home.score) {
            awayRoundsWon++;
        }
    }

    if (homeRoundsWon > 0) {
        for (let i = homeRoundsWon; i > 0; i--) {
            let round

            if (i === (extraArenaInfo.bestOf + 1) / 2) {
                round = document.getElementById(`r${i}`)
            } else {
                round = document.getElementById(`r${i}-home`)
            }
            round.style = "fill: var(--homeColor);"
        }
    } else {
        for (let i = 1; i < (extraArenaInfo.bestOf + 1) / 2; i++) {
            const round = document.getElementById(`r${i}-home`)
            round.style = "fill: var(--noColor);"
        }
    }

    if (awayRoundsWon > 0) {
        for (let i = awayRoundsWon; i > 0; i--) {
            let round

            if (i === (extraArenaInfo.bestOf + 1) / 2) {
                round = document.getElementById(`r${i}`)
            } else {
                round = document.getElementById(`r${i}-away`)
            }
            round.style = "fill: var(--awayColor);"
        }
    } else {
        for (let i = 1; i < (extraArenaInfo.bestOf + 1) / 2; i++) {
            const round = document.getElementById(`r${i}-away`)
            round.style = "fill: var(--noColor);"
        }
    }

    if (homeRoundsWon == 0 && awayRoundsWon == 0) {
        const round = document.getElementById(`r${(extraArenaInfo.bestOf + 1) / 2}`)
        round.style = "fill: var(--noColor);"
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

function updateDisplay(isOvertime) {
    const showMs = lastApiUpdate.isRunning;

    const now = Date.now();
    const elapsed = (now - lastApiUpdate.timestamp) / 1000;
    let currentTime = 0;

    if (showMs) {
        if (isOvertime) {
            currentTime = Math.max(0, lastApiUpdate.time + elapsed);
        } else {
            currentTime = Math.max(0, lastApiUpdate.time - elapsed);
        }
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

function updateTimer(newTimeSeconds, matchLengthSeconds, isOvertime) {
    if (animationId) cancelAnimationFrame(animationId);

    const isRunning = newTimeSeconds !== matchLengthSeconds;

    lastApiUpdate = {
        time: newTimeSeconds,
        timestamp: Date.now(),
        isRunning: isRunning
    };

    updateDisplay(isOvertime);
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
        // Image doesn't exist, clear
        imgElement.removeAttribute("href");
    };
    testImage.src = url;
}

updateAllSVGText();