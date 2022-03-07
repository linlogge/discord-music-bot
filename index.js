const Discord = require("discord.js")
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")
const { Player } = require("discord-player")

dotenv.config()
const TOKEN = process.env.TOKEN

const LOAD_SLASH = process.argv[2] == "load"

// ID des Bots angeben
const CLIENT_ID = "824946756110254080"
// ID des Servers angeben
const GUILD_ID = "949423992643653692"

// Neuen Discord Client erstellen
const client = new Discord.Client({
    intents: [
        // Berechtigung für Zugriff auf die Discord API
        "GUILDS",
        // Berechtigung für Zugriff auf Voice Chats
        "GUILD_VOICE_STATES"
    ]
})

client.slashcommands = new Discord.Collection()

// Neuen Musikplayer erstellen
client.player = new Player(client, {
    ytdlOptions: {
        // Qualität der Musik abwählen
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

let commands = []

// Slash-Commands einlesen
const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
// Slash-Commands einlesen und in commands array speichern
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if (LOAD_SLASH) {
    // Unsere Commands an den Discord Server hochladen
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands})
    .then(() => {
        console.log("Successfully loaded")
        process.exit(0)
    })
    .catch((err) => {
        if (err){
            console.log(err)
            process.exit(1)
        }
    })
}
else {
    // Wenn bot dem Server beitritt, in die Console schreiben
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
    })
    // Wenn ein Slash-Command in den Chat eingegeben wird, diesen ausführen
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            // Wenn nachricht kein Slash-Command ist, abbrechen
            if (!interaction.isCommand()) return

            // Slash-Command suchen und ausführen
            const slashcmd = client.slashcommands.get(interaction.commandName)
            // Wenn Slash-Command nicht gefunden wurde, abbrechen
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            // Slash-Command ausführen (Run methode, CLient = Bot, Interaction = Nachricht)
            await slashcmd.run({ client, interaction })
        }
        handleCommand()
    })
    client.login(TOKEN)
}

