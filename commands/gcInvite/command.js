import JSONdb from "simple-json-db";
import {bot, invites} from "../../bot.js"

export function inviteCommand({user, message, origin, command, args}) {
    if(["home", "livechat"].includes(origin)) {
        bot.post(`You must run this command in a group chat.`, origin)
        return
    }
    let subCommand = args[0];
    let subArgs = args.splice(1);
    switch (subCommand) {
        case "new":
            bot.post(`${addInvite(origin)}`, origin)
            break;
        case "join":
            if(!invites.has(subArgs[0])) {
                bot.post("Invalid invite!", origin);
                return;
            }
            bot.send({
                "cmd": "direct",
                "val": {
                    "cmd": "add_to_chat",
                    "val": {
                    "chatid": invites.get(subArgs[0]),
                    "username": user
                    }
                }
            })
            
            break;
    
        default:
            bot.post("Sub-Command not found", origin)
            break;
    }
}
function addInvite(gc) {
    let len = Object.keys(invites.JSON()).length
    let randomNum = ()=>{return Math.floor(Math.random() * 9)}
    let ID = `${len}-${randomNum()}${randomNum()}${randomNum()}`
    invites.set(ID, gc)
    invites.sync()
    return ID
}