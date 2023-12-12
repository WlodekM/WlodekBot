import {commandTags, help as helpVar, bot} from "../index.js"

export function help({user, message, origin, command, args}) {
    if (args[0] in helpVar) {
      bot.post(helpVar[args[0]], origin)
    } else {
      var msg = ""
      var helpArray = []
      msg += `Hello, i'm ${bot.username} - a multipurpose bot!\nHere are my commands:`
      for (const key in commandTags) {
        if (Object.hasOwnProperty.call(commandTags, key)) {
          const element = commandTags[key];
          if(helpArray[element[0]] == null) {
            helpArray[element[0]] = []
          }
          helpArray[element[0]].push(key)
        }
      }
      for (const key in helpArray) {
        if (Object.hasOwnProperty.call(helpArray, key)) {
          const element = helpArray[key];
          msg += "\n\n" + `=== ${key} ===` + "\n"
          element.forEach(elementi => {
            msg += elementi + ", "
          });
          msg += "\n"
        }
      }
      bot.post(msg, origin)
    }
}