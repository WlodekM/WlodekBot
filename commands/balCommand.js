import JSONdb from "simple-json-db";
const db = new JSONdb("./db/db.json");

export default {
    command: "balance",
    aliases: ["bal"],
    func({ user, message, origin, command, args, bot }) {
        db.sync()
        if (!db.has(`${user}-money`)) {
            db.set(`${user}-money`, 0)
        }
        if (args[0] == null) {
            var user_money = db.get(`${user}-money`)
            bot.post(`Your balance is ${user_money}${db.get("currency")}`, origin)
        } else if (args[0] == "reset") {
            db.set(`${user}-money`, 0)
            bot.post(`uh ${args[0]}`, origin)
        }
    }
}