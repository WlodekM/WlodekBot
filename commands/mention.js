export default {
    command: "mention",
    aliases: [],    
    func({user, message, origin, command, args, bot}) {
        bot.post(`Hello, i'm ${bot.username} - a multipurpose bot!\nMy prefix is \`@${bot.username}\` use \`@${bot.username} help\` to find out about my commands`, origin)
    }
}