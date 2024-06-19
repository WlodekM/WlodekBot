export default {
    command: "eval",
    aliases: ["run"],    
    func({user, message, origin, command, args, bot}) {
        if (args.length == 0) {
          bot.post(`[ℹ︎] Cannot evaluate "${args.join(" ")}"!`, origin)
          return
        }
        try {
          let evaluated = eval(args.join(" "))
          bot.post(`[✔︎] Evaluation success!\n${evaluated}`, origin)
        } catch (err) {
          bot.post(`[⚠︎] Evaluation failed!\n${err}`, origin)
        }
    }
}