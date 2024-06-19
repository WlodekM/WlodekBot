import { Client } from "@meower-media/meower";
import * as logs from "./libs/logs.js";
import fs from 'fs'
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
export let server
export const bot = new Client("wss://api.meower.org/v0/cloudli", "https://api.meower.org/")
export const config = JSON.parse(fs.readFileSync("config/config.json"))
export const auth = JSON.parse(fs.readFileSync("config/auth.json"))
export let update

export async function runBot() {
    let username = auth.bot.username
    let password = auth.bot.password
    let server = config.urls.server

    // Define bot stuff
    bot.version = config.bot.update.version
    bot.update  = config.bot.update
    update      = config.bot.update

    // Create log files if some other code needs them (*cough* the dashboard)
    logs.logMessage("---")
    logs.log("---")

    // Actual bot code yippee
    function doLogin(i) {
        if (i > 20) return;
        try {
            if(server) bot.server = server
            console.log(`: Trying to log in {${i}}`)
            bot.login(username, password)
        } catch (error) {
            doLogin(i + 1)
        }
    }

    bot.onPacket((messageData) => {
        if (messageData.cmd == "pmsg") {
            bot.send({ cmd: "pmsg", val: "I:100 | Bot", id: messageData.origin })
        }
        if (true) { logs.log(`[CL] ${messageData} (${config.settings.logCL})`); }
        let JSONdata = JSON.parse(messageData)
        switch (JSONdata["cmd"]) {
            case ("ulist"):
                fs.writeFileSync("stores/ulist.txt", JSON.stringify(JSONdata["val"].split(";").slice(0, -1)))
            case ("statuscode"):
                if (JSONdata["val"].includes("E") && true) {
                    logs.log(`! ${JSONdata["val"]}`)
                }
        }
    });

    bot.onLogin(async () => {
        // welcome.welcome()
        let a = await bot.post("helo this is a test")
        console.log(a)
        logs.log(`: Logged on as user ${username}`)
    });

    doLogin(0)
}