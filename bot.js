import Bot from "meowerbot";
import { exec } from "child_process";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import * as logs from "./libs/logs.js";
import fs from 'fs'
import { events, activeEvents } from "./libs/events.js";
import { scan as scanCommands } from "./commands/commandManager.js";
import * as welcome from "./libs/start/welcome_message.js";
//{ welcome, reload as setReloaded }
function getunix() {
    return (Math.floor(Date.now() / 1000))
}

export let username
export let password
export let admins
export let server
export let uptime
export let db
export let shop
export let invites
export const bot = new Bot()
export let config
export let auth
export let update

export async function runBot() {

    const commands = await scanCommands()
    const adminCommands = await scanCommands("./commands/admin", "admin/")

    function checkFiles() {
        function checkFile(file, content) {
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, content)
                log(`! File ${file} not found`)
            }
        }
        checkFile("stores/ulist.txt", "")
        // checkFile("logs.txt", "")

        checkFile("db/db.json", "{}")
        checkFile("db/invites.json", "{}")
        checkFile("db/messages.json", "{}")
        checkFile("db/shop.json", "{}")

        checkFile("config/config.json", "{}")
    }

    // Check if files like logs.txt exist
    checkFiles()

    config = JSON.parse(fs.readFileSync("config/config.json"))
    auth = JSON.parse(fs.readFileSync("config/auth.json"))

    let username = auth.bot.username
    let password = auth.bot.username
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
        logs.logMessage(`${user}: ${message} (in ${origin ? origin : "home"})`)

        if (user == "Server") return
        if (!message) return

        // Parse command
        let splitMessage = message.split(" ")
        let messagePrefix = message.split(" ")[0]

        if (messagePrefix != (prefix) && messagePrefix != `${prefix}#0000`) return;

        let command = (splitMessage[1])
        if (command) command = command.toLowerCase()
        let args = Array(message.split(" "))
        args = args.splice(2)

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

    bot.onMessage((messageData) => {
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