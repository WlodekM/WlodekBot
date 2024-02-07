import JSONdb from "simple-json-db";
import fs from "fs"
const db = new JSONdb("./db/db.json");
const shop = new JSONdb("../db/shop.json");

function formatshop(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p) => `${p[0]} - ${p[1]}${config.settings.economy.currency}`)
    .join("\n");
  return (result)
}

let config, configAuth
try {
  config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'))
} catch (e) {
  console.error("No config file found, please crete a config file!");
  console.error(e);
  process.exit()
}
try {
  configAuth = JSON.parse(fs.readFileSync('./config/auth.json', 'utf8'))
} catch (e) {
  console.error("No config-auth file found, please crete a config-auth file!");
  console.error(e);
  process.exit()
}

export default {
  command: "shell",
  aliases: [],    
  func({user, message, origin, command, args, bot}) {
    db.sync()
    shop.sync()
    if (!db.has(`${user}-money`)) {
      db.set(`${user}-money`, 0)
    }
    bot.post(`${formatshop(shop.JSON())}`)
  }
}