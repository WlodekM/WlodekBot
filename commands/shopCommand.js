import {bot, db, shop, config} from "../index.js"

function formatshop(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p) => `${p[0]} - ${p[1]}${config.settings.economy.currency}`)
    .join("\n");
  return (result)
}

export function shopCommand({user, message, origin, command, args}) {
    db.sync()
    shop.sync()
    if (!db.has(`${user}-money`)) {
      db.set(`${user}-money`, 0)
    }
    bot.post(`${formatshop(shop.JSON())}`)
}