export default {
    command: "botinfo",
    aliases: ["info", "about"],
    func({ user, message, origin, command, args, bot }) {
        bot.post(`Source code: https://github.com/WlodekM/WlodekBot\nCreator: @WlodekM3\nUptime: [WIP]`, origin)
    }
}