let bridges = {};
const delay = ms => new Promise(res => setTimeout(res, ms));

function bridgeCommand({user, message, origin, command, args, bot}) {
    let subCommand = args[0];
    let subArgs = args.splice(1);
    switch (subCommand) {
        case "dial":
            NewBridge(origin, subArgs[0], user)
            break;
        case "hangup":
            DeleteBridge(user, origin)
            break;
    
        default:
            bot.post("Sub-Command not found")
            break;
    }
}


function NewBridge(gc1, gc2, user) {
    if(bridges[user]) {
        bot.post("You already have a bridge opened");
        return;
    }
    bridges[user] = {gc1: gc1, gc2: gc2};
}

function DeleteBridge(user, origin) {
    if(!bridges[user]) {
        bot.post("You don't have a bridge open");
        return;
    }
    bot.post(`Bridge with ${bridges[user].gc2} deleted`, bridges[user].gc1);
    bot.post(`Bridge with ${bridges[user].gc1} deleted`, bridges[user].gc2);
    bridges[user] = null
}

export function OnMessage(message, origin, user) {
    let isInACall = false;
    let targetGC = "";
    Object.keys(bridges).forEach(element => {
        if(element.gc1 == origin) {
            isInACall = true;
            targetGC = element.gc2
        }
        if(element.gc2 == origin) {
            isInACall = true;
            targetGC = element.gc1
        }
    });
    if(!isInACall) return;
    bot.post(message, targetGC)
}