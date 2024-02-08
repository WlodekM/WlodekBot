import JSONdb from "simple-json-db";
import {bot, invites} from "../../bot.js"
const gcDB = new JSONdb("gc.json")

export function gcCommand({user, message, origin, command, args}) {
    let subCommand = args[0];
    let subArgs = args.splice(1);
    switch (subCommand) {
        case "invite":
            inviteCommand({user, message, origin, command, args})
            break;
    
        default:
            bot.post("Sub-Command not found", origin)
            break;
    }
}
function inviteCommand({user, message, origin, command, args}) {
    function addInvite(gc) {
        let len = Object.keys(invites.JSON()).length
        let randomNum = ()=>{return Math.floor(Math.random() * 9)}
        let ID = `${len}-${randomNum()}${randomNum()}${randomNum()}`
        invites.set(ID, gc)
        invites.sync()
        return ID
    }

    if(["home", "livechat"].includes(origin)) {
        bot.post(`You must run this command in a group chat.`, origin)
        return
    }
    let subCommand = args[0];
    let subArgs = args.splice(1);
    switch (subCommand) {
        case "new":
            let invite = addInvite(origin)
            if (!gcDB["gc"][origin]["invites"]) gcDB["gc"][origin]["invites"] = []
            gcDB["gc"][origin]["invites"].push(invite)
            bot.post(`${invite}`, origin);
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
                    "chatid": invites.get(subArgs[0]).id,
                    "username": user
                    }
                }
            });
            bot.post(`Succesfully added to ${invites.get(subArgs[0]).name}`, origin)
            
            break;
    
        default:
            bot.post("Sub-Command not found", origin)
            break;
    }
}