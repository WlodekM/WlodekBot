import fs from "fs"
import { bot, config } from "../../bot.js";
import { log } from "../logs.js";
import path from "path"

export const welcome_messages = JSON.parse(fs.readFileSync("./db/messages.json"));
let isReloaded = false

function getunix() {
    return (Math.floor(Date.now() / 1000))
}

export function setReloaded(a) {
    isReloaded = a
}

export function welcome() {
    // use this code to read nu mber of lines in all js files

    function countLinesInFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return data.split('\n').length;
        } catch (err) {
            log(`! Error reading file ${filePath}: ${err}`);
            return 0;
        }
    }

    function readFilesInDirectory(directoryPath) {
        try {
            const files = fs.readdirSync(directoryPath);

            let totalLines = 0;

            files.forEach(file => {
                const filePath = path.join(directoryPath, file);
                try {
                    const stats = fs.statSync(filePath);

                    if (stats.isDirectory()) {
                        // Handle directories if needed
                    } else if (stats.isFile() && path.extname(file) === '.js') {
                        // Process only .js files
                        const lines = countLinesInFile(filePath);
                        totalLines += lines;
                        // console.log(`File: ${filePath}, Lines: ${lines}`);
                    }
                } catch (err) {
                    log(`! Error processing file ${filePath}: ${err}`);
                }
            });

            return totalLines;
        } catch (err) {
            log(`! Error reading files: ${err}`);
            return 0;
        }
    }
    let lines = readFilesInDirectory("commands/")
    lines += readFilesInDirectory("libs/")
    lines += readFilesInDirectory("modules/")
    lines += readFilesInDirectory("www/")
    // const files = fs.readdirSync("");
    let mainFileLength = String(fs.readFileSync('bot.js')).split('\n').length

    // console.log(lines, mainFileLength, lines + mainFileLength)

    lines += mainFileLength

    // welcome_messages.sync()
    let lastStartup = fs.readFileSync("stores/lastStartup.txt") ?? 0
    var messages = welcome_messages.verified
    var random_message = messages[Math.floor(Math.random() * messages.length)].replaceAll("${username}", bot.username)
    // var random_message = "$(lnCount)$ test"
    random_message = random_message.replaceAll("$(lnCount)$", String(lines))
    if (getunix() - lastStartup > 600) {
        fs.writeFileSync("stores/lastStartup.txt", String(getunix()))
        // udate quote
        bot.send(
            {
                "cmd": "direct",
                "val": {
                    "cmd": "update_config",
                    "val": {
                        "quote": `v${bot.update.version} | ${String(lines)} lines of code | ${random_message}`
                    }
                }
            }
        )
    }
    if (isReloaded) return // showier angy
    if (getunix() - lastStartup > 600) {
        config.settings.welcomeMessages.forEach((a, i) => {
            bot.post(`${random_message}\nBot version: ${bot.update.version}`, a);
        })
    }
    // rl = (async () => {
    //     consoleInput(createInterface({
    //         input: process.stdin,
    //         output: process.stdout
    //     }), bot, username)
    // })()
}