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

        setTeamColors(gamemode)
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

function getPlayerNumber(playerName) {
    let playerNumber = 0;
    const player = getPlayerByName(playerName);

    if (player == null) {
        return playerNumber;
    }

    const logoAtlasUVOffsets = player.cosmeticMaterialMetadata.logoAtlasUVOffsets;
    playerNumber = logoAtlasUVOffsets.x + logoAtlasUVOffsets.y * 10;

    return playerNumber;
}

async function getPlayerByName(playerName) {
    try {
        const frameResponse = await fetch("http://localhost:5420/state");

        if (!frameResponse.ok) {
            return null;
        }

        const frameData = frameResponse.json();
        const players = frameData.players;

        let returnPlayer = null;

        for (const player of players) {
            if (player.playerName == playerName) {
                returnPlayer = player;
                break;
            }
        }

        return returnPlayer;

    } catch (error) {
        console.log(error)
    }

    return null;
}