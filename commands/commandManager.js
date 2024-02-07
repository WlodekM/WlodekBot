import fs from "fs";
console.log("commands")

export async function scan() {
    let commandsFolder = await fs.readdirSync("./commands")
    let commands = {}
    // i fucking hate async because most of the time you're gonna just use await
    for (const file of commandsFolder) {
        let command
        if (file == "commandManager.js") continue;
        if (!file.endsWith(".js")) continue;
        try {
            command = await import(`./${file}`);
        } catch(e) {
            console.log(file, e)
            continue
        }
        if (!command) continue;
        if (!command.default) continue;
        console.log("Found & imported command from " + file)
        commands[command.default.command] = command.default
    }
    return commands
}