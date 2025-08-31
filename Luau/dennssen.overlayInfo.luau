local _version: string = "1.0.0"
metadata = {
	name = "Overlay Info",
	description = "TBD",
	author = "Dennssen",
	defaultKeybind = "",
}

local saveInterval = 0.5 -- 1 is good middle ground between safe and efficiency
local saveTime = 0
local currentConfig
local lastConfig

local configStructure = {
	statsInfo = {
		away = {},
		home = {},
	},
	gamemodeSlotId = "",
	extraArenaInfo = {
		home = {
			name = "",
			players = {},
		},
		away = {
			name = "",
			players = {},
		},
		rounds = {},
		followedPlayer = "",
		lastShotInfo = {
			shooter = "",
			assister = "",
			team = "",
			shotSpeed = 0,
			shotDistanceMeters = 0,
		},
		isGracePeriod = false,
		isOvertime = false,
		bestOf = 0,
		matchLengthSeconds = 0,
	},
}

function configInit(default)
	if config.statsInfo == nil then
		warn("config stucture has changed")
		config = default
		saveConfig()
	end
end

function compareTwoTables(table1, table2, structureOnly: boolean): boolean
	for key1, value1 in table1 do
		local value2 = table2[key1]
		if value2 == nil then
			return false
		end

		if typeof(value1) == "table" and typeof(value2) == "table" then
			if not compareTwoTables(value1, value2, structureOnly) then
				return false
			end
		elseif value1 ~= value2 and not structureOnly then
			return false
		end
	end

	for key, _ in table2 do
		if table1[key] == nil then
			return false
		end
	end

	return true
end

function deepCopyTable(table)
	local copiedTable = {}
	for key, value in table do
		if typeof(value) == "table" then
			copiedTable[key] = deepCopyTable(value)
		else
			copiedTable[key] = value
		end
	end

	return copiedTable
end

function main()
	configInit(configStructure)
	lastConfig = deepCopyTable(config)
	currentConfig = deepCopyTable(lastConfig)

	alwaysTick = true
end

function tick(dt)
	if saveTime < saveInterval then
		saveTime += dt
		return
	end

	saveTime = 0

	if not compareTwoTables(currentConfig, lastConfig, false) then
		config = currentConfig
		saveConfig()
	end
end

function onMessageReceived(messageTable: { info: string, value: any })
	local info = messageTable.info
	local value = messageTable.value

	if info == "version" then
		value(_version)
	elseif info == "slotId" then
		currentConfig.gamemodeSlotId = value
	elseif info == "players" then
		currentConfig.extraArenaInfo[value.team].players = value.players
	elseif info == "rounds" then
		if value == "clear" then
			currentConfig.extraArenaInfo.rounds = {}
		elseif value == "remove" then
			table.remove(currentConfig.extraArenaInfo.rounds)
		else
			table.insert(currentConfig.extraArenaInfo.rounds, value)
		end
	elseif info == "followedPlayer" then
		currentConfig.extraArenaInfo.followedPlayer = value
	elseif info == "shot" then
		currentConfig.extraArenaInfo.lastShotInfo = {
			shooter = value.shooter,
			assister = value.assister,
			team = value.team,
			shotSpeed = value.shotSpeed,
			shotDistanceMeters = value.shotDistanceMeters,
		}
	elseif info == "overtime" then
		currentConfig.extraArenaInfo.isOvertime = value
	elseif info == "grace" then
		currentConfig.extraArenaInfo.isGracePeriod = value
	elseif info == "bestOf" then
		currentConfig.extraArenaInfo.bestOf = value
	elseif info == "matchLength" then
		currentConfig.extraArenaInfo.matchLengthSeconds = value
	elseif info == "stats" then
		if value == "clear" then
			currentConfig.statsInfo.home = {}
			currentConfig.statsInfo.away = {}
		else
			local statsPlayer = currentConfig.statsInfo[value.team][value.player]
			if statsPlayer == nil then
				currentConfig.statsInfo[value.team][value.player] = {
					goals = 0,
					saves = 0,
					assists = 0,
				}
			end
			currentConfig.statsInfo[value.team][value.player][value.stat] += 1
		end
	elseif info == "teamNames" then
		currentConfig.extraArenaInfo.home.name = value.home
		currentConfig.extraArenaInfo.away.name = value.away
	end
end
