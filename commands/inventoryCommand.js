import {bot, db} from "../index.js"

export function inventoryCommand({user, message, origin, command, args}) {shop.sync()
    if (!db.has(`${user}-inventory`)) db.set(`${user}-inventory`, [])
    var userinventory = db.get(`${user}-inventory`)
    bot.post(`=== ${user}'s inventory ===\n${userinventory.join(",\n")}`)
}