import JSONdb from "simple-json-db";
const db = new JSONdb("../db.json");
const shop = new JSONdb("../shop.json");

export default {
  command: "buy",
  aliases: [],    
  func({user, message, origin, command, args, bot}) {
    db.sync()
    shop.sync()
    args = toTitleCase(args.join(" "))
    if (!db.has(`${user}-money`)) {
      db.set(`${user}-money`, 0)
    }
    if (!db.has(`${user}-inventory`)) {
      db.set(`${user}-inventory`, [])
    }
    if(shop.has(args)) {
      // bot.post(`Item "${args[0]}" was found, but i didn't add buying yet ¯\\_(ツ)_/¯`,origin)
      var userinventory = db.get(`${user}-inventory`)
      var userbalance = db.get(`${user}-money`)
      var itemprice = shop.get(args)
      if(userbalance >= itemprice) {
        userinventory.push(args)
        db.set(`${user}-inventory`, userinventory)
        db.set(`${user}-money`, userbalance - itemprice)
        bot.post(`Item "${args}" bought!`, origin)
      } else {
        bot.post(`You don't have enough money\n(${userbalance} < ${itemprice})`, origin)
      }
    } else {
      bot.post(`Item "${(args)}" was not found`,origin)
    }
  }
}