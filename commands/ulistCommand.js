import fs from "fs"

export default {
    command: "ulist",
    aliases: ["userlist"],    
    func({user, message, origin, command, args, bot}) {
        const data = fs.readFileSync('stores/ulist.txt')
        if (err) {
            console.error(err);
            return;
        }
        var userlist = JSON.parse(data)
        bot.post(`There are currently ${userlist.length} user(s) online (${userlist.join(", ")}).`, origin)
    }
}