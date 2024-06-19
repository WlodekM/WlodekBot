import { Client } from "@meower-media/meower";

export const help = {
    "help": "Get info about my commands",
    "botinfo": "Get some info about me and my creator",
    "suggest": "Suggest a command",
    "changelog": "See what's new",
    "userlist": "Find out who's online",
    "andminlist": "List of all admins",
    "whois": "Get info about a user",
    "balance": "See how empty your wallet is",
    "work": `Earn money`,
    "leaderboard": "See who's №1",
    "shop": "See what you can buy",
    "buy": "Buy useless items",
    "rost": "Roast someone with my roasting skillz",
    "uniBridge": "WIP",
    "invite": "Make an invite to a group chat"
}
export const commandTags = {
    "help": ["BOT"],
    "botinfo": ["BOT"],
    "suggest": ["BOT"],
    "changelog": ["BOT"],
    "userlist": ["USER"],
    "adminlist": ["USER"],
    "whois": ["USER"],
    "roast": ["USER"],
    "balance": ["ECONOMY"],
    "work": ["ECONOMY"],
    "leaderboard": ["ECONOMY"],
    "shop": ["ECONOMY"],
    "buy": ["ECONOMY"],
    "invite": ["UTILITY"]
    // "uniBridge": ["OTHER"]
}
let commandNames = Object.keys(help)
const adminlevels = [
    "User",
    "Lower moderator",
    "Moderator",
    "Admin",
    "System admin"
]
const admincommands = [
    'eval',
    'shutdown',
    'restart',
    "update",
    "suggestions",
    "ban",
    "reset",
    "unban",
    "wordle",
    "shell",
    "uniBridge"
]
admincommands.forEach(element => {
    commandTags[element] = ["ADMIN"]
});

export default {
    command: "help",
    aliases: ["?"],
    /**
     * a
     * @param {Object} param0
     * @param {String} param0.user
     * @param {Client} param0.bot
     */
    func({ user, message, origin, command, args, bot }) {
        if (help[args[0]]) {
            bot.post(help[args[0]], origin)
        } else {
            let msg = ""
            let helpArray = []
            msg += `Hello, i'm ${bot.username} - a multipurpose bot!\nHere are my commands:`
            for (const key in commandTags) {
                if (Object.hasOwnProperty.call(commandTags, key)) {
                    const element = commandTags[key];
                    if (helpArray[element[0]] == null) {
                        helpArray[element[0]] = []
                    }
                    helpArray[element[0]].push(key)
                }
            }
            for (const key in helpArray) {
                if (Object.hasOwnProperty.call(helpArray, key)) {
                    const element = helpArray[key];
                    msg += "\n\n" + `=== ${key} ===` + "\n"
                    element.forEach(elementi => {
                        msg += elementi + ", "
                    });
                    msg += "\n"
                }
            }
            bot.post(msg, origin)
        }
    }
}