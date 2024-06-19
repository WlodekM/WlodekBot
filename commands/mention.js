export default {
    command: "mention",
    aliases: [],    
    func({user, message, origin, command, args, bot}) {
        bot.post(`Hello, i'm ${bot.user.username} - a multipurpose bot!\nMy prefix is \`@${bot.user.username}\` use \`@${bot.user.username} help\` to find out about my commands`, origin)
    }
}