import JSONdb from "simple-json-db";
const db = new JSONdb("./db/db.json");

export default {
    command: "inventory",
    aliases: ["inv"],    
    func({user, message, origin, command, args, bot}) {shop.sync()
        if (!db.has(`${user}-inventory`)) db.set(`${user}-inventory`, [])
        let userinventory = db.get(`${user}-inventory`)
        bot.post(`=== ${user}'s inventory ===\n${userinventory.join(",\n")}`)
    }
}