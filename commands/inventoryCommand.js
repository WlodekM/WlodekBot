import JSONdb from "simple-json-db";
const db = new JSONdb("../db.json");

export default {
    command: "inventory",
    aliases: ["inv"],    
    func({user, message, origin, command, args, bot}) {shop.sync()
        if (!db.has(`${user}-inventory`)) db.set(`${user}-inventory`, [])
        var userinventory = db.get(`${user}-inventory`)
        bot.post(`=== ${user}'s inventory ===\n${userinventory.join(",\n")}`)
    }
}