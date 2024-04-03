import Bot from "./MeowerBot.js/dist/MeowerBot.js";
// import { exec } from "child_process";
import { delay } from "./libs/delay.js"
// import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import * as logs from "./libs/logs.js";
import fs from 'fs'
import { events, activeEvents } from "./libs/events.js";
import { scan as scanCommands } from "./commands/commandManager.js";
import * as welcome from "./libs/start/welcome_message.js";

function getunix() {
    return (Math.floor(Date.now() / 1000))
}
function checkFiles() {
    function checkFile(file, content) {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, content)
            logs.log(`! File ${file} not found`)
        }
    }
    function checkFolder(folder) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true })
            logs.log(`! Folder ${folder} not found`)
        }
    }
    checkFolder("stores")
    checkFolder("config")
    checkFolder("logs")
    checkFolder("db")
    checkFile("stores/ulist.txt", "")
    checkFile("stores/lastStartup.txt", "")
    // checkFile("logs.txt", "")

    checkFile("db/db.json", "{}")
    checkFile("db/invites.json", "{}")
    checkFile("db/messages.json", "{}")
    checkFile("db/shop.json", "{}")

    checkFile("config/config.json", "{}")
}

// Check if files like logs.txt exist
checkFiles()

export let username
export let password
export let admins
export let server
export let uptime
export let db
export let shop
export let invites
export const bot = new Bot()
export const config = JSON.parse(fs.readFileSync("config/config.json"))
export const auth = JSON.parse(fs.readFileSync("config/auth.json"))
export let update

export async function runBot() {

    const commands = await scanCommands()
    const adminCommands = await scanCommands("./commands/admin", "admin/")

    let username = auth.bot.username
    let password = auth.bot.password
    let admins = config.bot.admins;
    let server = config.urls.server
    let uptime = new Date().getTime();
    let db = new JSONdb("./db/db.json");
    let shop = new JSONdb("./db/shop.json");
    let invites = new JSONdb("./commands/gcInvite/invites.json")

    // Define bot stuff
    bot.version = config.bot.update.version
    bot.update  = config.bot.update
    update      = config.bot.update
    const prefix = "@" + username

    // Create log files if some other code needs them (*cough* the dashboard)
    logs.logMessage("---")
    logs.log("---")

    const modules = []
    config.modules.forEach(async m => {
        try {
            let im = await import(`./modules/${m}.js`)
            console.log(im)
            modules.push(im.default)
            console.log(`Attempting to run module "${m}"`)
            im.default.run(config, auth)
        } catch(e) {
            console.log(`Error occurred while loading module "${m}"`, e)
        }
    })

    // UwU event mixin
    if (activeEvents.includes("uwu")) {
        bot.post = events.uwu.post
    }

    // Actual bot code yippee
    function doLogin(i) {
        if (i > 20) return;
        try {
            bot.login(username, password, server)
        } catch (error) {
            doLogin(i + 1)
        }
    }

    bot.onPost((user, message, origin) => {
        function respond(text, origin) {
            if (text.split().length < 4000) {
                bot.post(text, origin)
                return;
            }
            bot.post(text.slice(3996) + "...")
        }
        const isAdmin = admins.includes(user)
        // log post
        logs.log(`${user}: ${message} (in ${origin ? origin : "home"})`)
        logs.logMessage(JSON.stringify({
            user: user,
            message: message,
            origin: origin
        }))

        if (user == "Server") return
        if (!message) return

        // Parse command
        let splitMessage = message.split(" ")
        let messagePrefix = message.split(" ")[0]

        if (messagePrefix != (prefix) && messagePrefix != `${prefix}#0000`) return;

        let command = (splitMessage[1])
        if (command) command = command.toLowerCase()
        let args = message.split(" ")
        args = args.splice(2)
        logs.log(`${command} | ${args} | ${message.split(" ")}`)

        if (command == null) {
            command = "mention"
        }

        message = message.split(" ")

        if (!config.settings.consoleInput) console.log(`${user} is using the command ${command}`)
        logs.log(`${user} used the command ${command}`)

        if (db.get(`${user}-ban-end`) >= getunix()) {
            let cooldown_left = db.get(`${user}-ban-end`) - getunix()
            bot.post(`You are banned for ${db.get(`${user}-ban-reason`)} for ${cooldown_left} more second${cooldown_left = 1 ? "s" : ""}`, origin)
            return;
        }

        // const commandParams = { user, message, origin, command, args, bot }

        function checkForCommand(commandName) {
            let command = null
            // console.log("Checking for commands", Object.keys(allCommands).length)
            for (const key in commands) {
                if (Object.hasOwnProperty.call(commands, key)) {
                    const element = commands[key];
                    // console.log(`${commandName} == ${element.command}`)
                    if (commandName == element.command || element.aliases.includes(commandName)) {
                        command = element
                        break
                    }
                }
            }
            let foundAdmin = false
            for (const key in adminCommands) {
                if (Object.hasOwnProperty.call(adminCommands, key)) {
                    const element = adminCommands[key];
                    // console.log(`${commandName} == ${element.command}`)
                    if (commandName == element.command || element.aliases.includes(commandName)) {
                        command = element
                        foundAdmin = true
                        break
                    }
                }
            }
            if (foundAdmin && !isAdmin) return bot.post(`Command "${commandName}" is admin-only!`, origin)
            if (!command) return bot.post(`Command "${commandName}" not found!`, origin)
            console.log(`Found command that matches ${commandName} (${command.command})`)
            command.func(
                { user, message, origin, commandName, args, bot }
            )
        }
        checkForCommand(command)
    });

    bot.onPacket((messageData) => {
        if (messageData.cmd == "pmsg") {
            bot.send_packet({ cmd: "pmsg", val: "I:100 | Bot", id: messageData.origin })
        }
        if (config.settings.logCL == "true") { logs.log(`[CL] ${messageData} (${config.settings.logCL})`); }
        var JSONdata = JSON.parse(messageData)
        switch (JSONdata["cmd"]) {
            case ("ulist"):
                fs.writeFileSync("stores/ulist.txt", JSON.stringify(JSONdata["val"].split(";").slice(0, -1)))
            case ("statuscode"):
                if (JSONdata["val"].includes("E") && config.settings.logCL == "true") {
                    logs.log(`! ${JSONdata["val"]}`)
                }
        }
    });

    bot.onClose(() => {
        console.log('bot is ded');
        // rl.close()
        logs.log(`: Bot died`)
        welcome.setReloaded(true)
        delay(1500);
        doLogin(0)
    });

    bot.onLogin(() => {
        welcome.welcome()
        logs.log(`: Logged on as user ${username}`)
    });

    doLogin(0)
}