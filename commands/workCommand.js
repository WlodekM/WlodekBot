import JSONdb from "simple-json-db";
import fs from "fs";
const db = new JSONdb("./db/db.json");

let config, configAuth
try {
  config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'))
} catch (e) {
  console.error("No config file found, please crete a config file!");
  console.error(e);
  process.exit()
}
try {
  configAuth = JSON.parse(fs.readFileSync('config/auth.json', 'utf8'))
} catch (e) {
  console.error("No config-auth file found, please crete a config-auth file!");
  console.error(e);
  process.exit()
}

function getunix() {
    return (Math.floor(Date.now() / 1000))
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default {
    command: "work",
    aliases: [],    
    func({user, message, origin, command, args, bot}) {
        db.sync();
        if (!db.has(`${user}-money`)) db.set(`${user}-money`, 0);
        if (!db.has(`${user}-work-cooldown`)) db.set(`${user}-work-cooldown`, 0);
        const cooldown = db.get(`${user}-work-cooldown`);
        if (cooldown <= getunix()) {
            const moneyEarned = getRandomInt(16, 32);
            const userMoney = db.get(`${user}-money`);
            db.set(`${user}-money`, userMoney + moneyEarned);
            db.set(`${user}-work-cooldown`, getunix() + Number(config.settings.economy.workCooldown));
            bot.post(`You have earned ${moneyEarned}${config.settings.economy.currency}`, origin);
        } else {
            const cooldownLeft = cooldown - getunix();
            bot.post(`You need to wait ${cooldownLeft} more second${cooldownLeft == 1 ? "" : "s"}`, origin);
        }

        db.sync();
    }
}