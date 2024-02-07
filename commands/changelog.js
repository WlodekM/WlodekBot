export default {
    command: "changelog",
    aliases: ["new"],
    func({ user, message, origin, command, args, bot }) {
        bot.post(`# === ${bot.version} ===\n${bot.update.changelog}`, origin)
    }
}