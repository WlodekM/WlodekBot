import JSONdb from "simple-json-db";
const db = new JSONdb("./db/db.json");

export default {
    command: "ban",
    aliases: [],
    func({ user, message, origin, command, args, bot }) {
        db.sync()
        if (Number(args[1]) == args[1]) {
            if (args.length > 2) {
                var reason = args.slice(2).join(" ")
                var time = getunix() + Number(args[1])
                var banneduser = args[0]
                db.set(`${banneduser}-ban-end`, time)
                db.set(`${banneduser}-ban-reason`, reason)
            }
        }
    }
}