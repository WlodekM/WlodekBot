import {bot, db, shop} from "../index.js"

export function giveCommand({user, message, origin, command, args}) {
    db.sync()
    shop.sync()
    args = toTitleCase(args.join(" "))
    if (!db.has(`${user}-money`)) {
      db.set(`${user}-money`, 0)
    }
    if (!db.has(`${user}-inventory`)) {
      db.set(`${user}-inventory`, [])
    }
    if(db.has(`${args[0]}-money`)) {
      // bot.post(`Item "${args[0]}" was found, but i didn't add buying yet ¯\\_(ツ)_/¯`,origin)
      // var userinventory = db.get(`${user}-inventory`)
      var userbalance = db.get(`${user}-money`)
      var toGive = Number(args[1])
      if(userbalance >= toGive) {
        db.set(`${args[0]}-inventory`, toGive)
        db.set(`${user}-money`, userbalance - itemprice)
        bot.post(`It worky`, origin)
      } else {
        bot.post(`You don't have enough money\n(${userbalance} < ${itemprice})`, origin)
      }
    } else {
      bot.post(`User "${(args)}" was not found`,origin)
    }
}