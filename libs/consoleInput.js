import { log } from './logs.js';

export function setup() {
    return ""
}

export async function input(rl, bot, username) {
    const question = (query) => new Promise((resolve) => rl.question(query, resolve));
    const cmd = await question('')

    let command = cmd.split(" ")[0]
    let args = cmd.split(" ").splice(1)

    switch (command) {
        case "msg":
            log(`${username}: ${args.join(" ")} (in home)`)
            bot.post(args.join(" "))
            break;
        // case "msgChat":
        //     log(`${username}: ${args.splice(1).join(" ")} (in ${args[0]})`)
        //     let origin = args[0]
        //     args = args.splice(1)
        //     bot.post(args.join(" "), origin)
        //     break;
        case "exit":
            rl.close()
            process.exit()
            break;
        case "eval":
            console.log(eval(args.join(" ")))
            break;
    
        default:
            console.log(`Unknown command "${command}"`)
            break;
    }

    input(rl)
    return(rl)
}