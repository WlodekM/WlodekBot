import fs from "fs";
console.log("commands")

export async function scan(path="./commands", path2="") {
    let commandsFolder = await fs.readdirSync(path)
    let commands = {}
    for (const file of commandsFolder) {
        let command
        if (file == "commandManager.js") continue;
        if (!file.endsWith(".js")) continue;
        try {
            command = await import(`./${path2}${file}`);
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