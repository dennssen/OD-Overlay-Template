let slotId = "";
let previousSlotId = "";

let players = {};

const zeroVector = { x: 0, y: 0, z: 0 };
let gamemodePosition = zeroVector;
let gamemodeRotation = zeroVector;
let gamemodeSize = {
    width: 0,
    height: 0,
    length: 0
}

let previousHomePlayers = [];
let previousAwayPlayers = [];

let positionSmoothing = 0.2;

let iconPositions = {
    home: {},
    away: {}
};

let overlayFramerate = 5;
let iconFramerate = 60;

const compareArrays = (a, b) =>
    a.length === b.length &&
    a.every((element, index) => element === b[index]);

function cross(vec1, vec2) {
    const resultX = vec1.y * vec2.z - vec1.z * vec2.y;
    const resultY = vec1.z * vec2.x - vec1.x * vec2.z;
    const resultZ = vec1.x * vec2.y - vec1.y * vec2.x;

    return { x: resultX, y: resultY, z: resultZ };
}

function clamp(n, min, max) {
    if (n < min) {
        return min;
    } else if (n > max) {
        return max;
    } else {
        return n;
    }
}

function addVecs(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}

function subVecs(vec1, vec2) {
    return { x: vec1.x - vec2.x, y: vec1.y - vec2.y, z: vec1.z - vec2.z };
}

function multVec(vec, float) {
    return { x: vec.x * float, y: vec.y * float, z: vec.z * float };
}

function lerp(a, b, t) {
    t = clamp(t, 0, 1);
    return a + (b - a) * t;
}

function lerpVec(a, b, t) {
    t = clamp(t, 0, 1);
    const x = lerp(a.x, b.x, t);
    const y = lerp(a.y, b.y, t);
    const z = lerp(a.z, b.z, t);

    return { x: x, y: y, z: z };
}

function randomVector(factor) {
    const x = (Math.random() * (factor * 2)) - factor;
    const y = (Math.random() * (factor * 2)) - factor;
    const z = (Math.random() * (factor * 2)) - factor;

    return { x: x, y: y, z: z }
}

function rotateVectorByQuat(quat, vector) {
    const u = { x: quat.x, y: quat.y, z: quat.z };
    const s = quat.w;

    const t = multVec(cross(u, vector), 2);
    const rotated = addVecs(vector, addVecs(multVec(t, s), cross(u, t)));
    return rotated;
}

async function updatePlayerList() {
    try {
        const frameResponse = await fetch("http://localhost:5420/state");

        if (!frameResponse.ok) {
            return null;
        }

        const frameData = await frameResponse.json();
        players = frameData.players;
    } catch (error) {
        console.log(error);
    }
}

function getPlayerByName(playerName) {
    let returnPlayer = null;

    for (const player of players) {
        if (player.playerName == playerName) {
            returnPlayer = player;
            break;
        }
    }

    return returnPlayer;
}

async function updateOverlay() {
    const camera_id = "dennssen.overlayInfo";

    try {
        const cameraConfigResponse = await fetch(`http://localhost:5420/cameras/${camera_id}/config`);

        if (!cameraConfigResponse.ok) {
            return
        }

        const cameraConfig = await cameraConfigResponse.json();

        const extraArenaInfo = cameraConfig.extraArenaInfo;
        slotId = cameraConfig.gamemodeSlotId;

        setGamemodeTransform(extraArenaInfo);
        await updatePlayerList();
        updatePlayerIcons(extraArenaInfo);
    } catch (error) {
        console.log(error)
    }
}

setInterval(updateOverlay, 1000 / overlayFramerate);

async function setGamemodeTransform(extraArenaInfo) {
    if (slotId === previousSlotId) {
        return;
    }

    const gamemodesResponse = await fetch(`http://localhost:5420/state/gamemodes`);

    if (!gamemodesResponse.ok) {
        return;
    }

    gamemodeSize = {
        width: extraArenaInfo.arenaSize.width,
        height: extraArenaInfo.arenaSize.height,
        length: extraArenaInfo.arenaSize.length
    };

    const gamemodesData = await gamemodesResponse.json();

    for (const gamemode of gamemodesData.gamemodes) {
        if (gamemode.slotId == slotId) {
            gamemodePosition = gamemode.position
            gamemodeRotation = gamemode.rotation
            break;
        }
    }

    previousSlotId = slotId;
}

function getLocalPlayerPosition(playerName) {
    const player = getPlayerByName(playerName);

    if (player == null) {
        return { x: 0, y: 0, z: 0 };
    }

    const position = player.root.position;

    return rotateVectorByQuat(gamemodeRotation, subVecs(position, gamemodePosition));
}

async function setTeamColors() {
    try {
        const gamemodeResponse = await fetch(`http://localhost:5420/state/gamemodes/${slotId}`)

        if (!gamemodeResponse.ok) {
            return
        }

        const gamemode = await gamemodeResponse.json();

        const root = document.querySelector(":root")

        const homeColor = gamemode.teams[0].teamColor.primary
        const awayColor = gamemode.teams[1].teamColor.primary

        root.style.setProperty("--homeColor", `rgba(${homeColor.r}, ${homeColor.g}, ${homeColor.b}, ${homeColor.a})`)
        root.style.setProperty("--awayColor", `rgba(${awayColor.r}, ${awayColor.g}, ${awayColor.b}, ${awayColor.a})`)
    } catch (error) {
        console.log(error);
    }

}

function getPlayerNumber(playerName) {
    let playerNumber = 0;
    const player = getPlayerByName(playerName);

    if (player == null) {
        return playerNumber;
    }

    // logoAtlasUVOffsets is the player number that is shown on the player models back and shoulders. 
    // Y is the first digit and x is the second, therefore we multiply y with 10.
    const logoAtlasUVOffsets = player.cosmeticMaterialMetadata.logoAtlasUVOffsets;
    playerNumber = logoAtlasUVOffsets.x + logoAtlasUVOffsets.y * 10;

    return playerNumber;
}

function updatePlayerIcons(extraArenaInfo) {
    const homePlayers = extraArenaInfo.home.players;
    const awayPlayers = extraArenaInfo.away.players;
    let playersChanged = false

    if (!compareArrays(homePlayers, previousHomePlayers)) {
        playersChanged = true;
    }

    if (!compareArrays(awayPlayers, previousAwayPlayers)) {
        playersChanged = true;
    }

    if (playersChanged) {
        setTeamColors();
        createPlayerIcons(extraArenaInfo);
    }

    for (const [playerName, icon] of Object.entries(iconPositions.home)) {
        const position = getLocalPlayerPosition(playerName);
        icon.targetPosition = position;
        icon.updateTime = Date.now();
    }

    for (const [playerName, icon] of Object.entries(iconPositions.away)) {
        const position = getLocalPlayerPosition(playerName);
        icon.targetPosition = position;
        icon.updateTime = Date.now();
    }

    previousHomePlayers = homePlayers;
    previousAwayPlayers = awayPlayers;
}

function createPlayerIcons(extraArenaInfo) {
    const homePlayers = extraArenaInfo.home.players;
    const awayPlayers = extraArenaInfo.away.players;
    const homeDiv = document.getElementById("Home-Players");
    const awayDiv = document.getElementById("Away-Players");

    if (homeDiv == null || awayDiv == null) {
        return;
    }

    homeDiv.innerHTML = "";
    iconPositions.home = {};
    for (playerName of homePlayers) {
        const playerNumber = getPlayerNumber(playerName);
        const playerHTML = `<svg class="PlayerIcon" id="${playerName}" height="120" width="120" xmlns="http://www.w3.org/2000/svg">
            <circle class="Home Fill" r="50%" cx="50%" cy="50%" stroke="black" />
            <text x="50%" y="50%" font-size="75" fill="white" stroke="black" stroke-width="1.3">${playerNumber}</text>
        </svg>`;
        homeDiv.innerHTML += playerHTML;
        iconPositions.home[playerName] = {
            position: zeroVector,
            targetPosition: zeroVector,
            updateTime: Date.now()
        }
    };

    awayDiv.innerHTML = "";
    iconPositions.away = {};
    for (playerName of awayPlayers) {
        const playerNumber = getPlayerNumber(playerName);
        const playerHTML = `<svg class="PlayerIcon" id="${playerName}" height="120" width="120" xmlns="http://www.w3.org/2000/svg">
            <circle class="Away Fill" r="50%" cx="50%" cy="50%" stroke="black" stroke-width="2" />
            <text x="50%" y="50%" font-size="75" fill="white" stroke="black" stroke-width="2">${playerNumber}</text>
        </svg>`;
        awayDiv.innerHTML += playerHTML;
        iconPositions.away[playerName] = {
            position: zeroVector,
            targetPosition: zeroVector,
            updateTime: Date.now()
        }
    };
}

function mapIconPositions() {
    const iconSize = 89;
    const minimap = document.querySelector("#minimap");
    const minimapWidth = minimap.getBoundingClientRect().width;
    const minimapHeight = minimap.getBoundingClientRect().height;

    Object.entries(iconPositions.home).forEach(([playerName, icon]) => {
        const normalizedX = icon.position.y / (gamemodeSize.width / 2);
        const normalizedY = icon.position.x / (gamemodeSize.length / 2);

        // the mapped x and y coordinates in percentages
        let x = 50 + (-normalizedX * 50);
        let y = 50 + (normalizedY * 50);

        const widthReduction = (iconSize / minimapWidth * 100) / 2;
        const heightReduction = (iconSize / minimapHeight * 100) / 2;

        x -= widthReduction;
        y -= heightReduction;

        const element = document.getElementById(playerName);
        element.setAttribute('x', `${x}%`);
        element.setAttribute('y', `${y}%`);
    });

    Object.entries(iconPositions.away).forEach(([playerName, icon]) => {
        const normalizedX = icon.position.y / (gamemodeSize.width / 2);
        const normalizedY = icon.position.x / (gamemodeSize.length / 2);

        // the mapped x and y coordinates in percentages
        let x = 50 + (-normalizedX * 50);
        let y = 50 + (normalizedY * 50);

        const widthReduction = (iconSize / minimapWidth * 100) / 2;
        const heightReduction = (iconSize / minimapHeight * 100) / 2;

        x -= widthReduction;
        y -= heightReduction;

        const element = document.getElementById(playerName);
        element.setAttribute('x', `${x}%`);
        element.setAttribute('y', `${y}%`);
    });
}

function updateIconPositions() {
    const deltaTime = 1 / iconFramerate;
    for (const [_, icon] of Object.entries(iconPositions.home)) {
        icon.position = lerpVec(icon.position, icon.targetPosition, deltaTime / (positionSmoothing + deltaTime));
    }

    for (const [_, icon] of Object.entries(iconPositions.away)) {
        icon.position = lerpVec(icon.position, icon.targetPosition, deltaTime / (positionSmoothing + deltaTime));
    }

    mapIconPositions();
}

setInterval(updateIconPositions, 1000 / iconFramerate);