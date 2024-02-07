export default {
    command: "mention",
    aliases: [],    
    func({user, message, origin, command, args, bot}) {
        bot.post("Hello, i'm wlbot - a multipurpose bot!\nMy prefix is `@wlbot` use `@wlbot help` to find out about my commands", origin)
    }
}