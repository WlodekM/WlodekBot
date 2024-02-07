import fs from "fs"

export default {
  command: "roast",
  aliases: [],    
  func({user, message, origin, command, args, bot}) {
    if(args.length < 1) bot.post("You have to mention a user!")
    if(!args[0].startsWith("@")) bot.post("You have to mention a user!")
    fs.readFile('roasts.txt', 'utf8', (err, data) => {
      var roasts = data.split("\n")
      bot.post(
        (args[0] + " " + roasts[Math.floor(Math.random() * roasts.length)]), origin
      );
    });
  }
}