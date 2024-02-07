import JSONdb from "simple-json-db";
const db = new JSONdb("./db/db.json");

function leaderboardarray(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p, index) => `${p[0]} - ${p[1]}`)
  return (result)
}
function leaderboardarrayplace(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p, index) => p[0])
  return (result)
}

export default {
  command: "leaderboard",
  aliases: ["lb", "top"],    
  func({user, message, origin, command, args, bot}) {
    db.sync()
    var database_a = db.JSON()
    var money_leaderboard = {}
    for (const key in database_a) {
      if (Object.hasOwnProperty.call(database_a, key)) {
        const element = database_a[key];
        if (key.includes("-money")) {
          let keya = key.replaceAll("-money", "")
          money_leaderboard[keya] = element
        }
      }
    }
    console.log(`LB!: ${JSON.stringify((leaderboardarrayplace(money_leaderboard)))}`)
    var user_place = (Object.values(leaderboardarrayplace(money_leaderboard)).indexOf(user)) + 1
    money_leaderboard = Object.values(leaderboardarray(money_leaderboard))
    if (args[0] != "full") {
      money_leaderboard = money_leaderboard.slice(0, 10)
    }
    bot.post(`${money_leaderboard.join("\n")}\n\nYou are №${user_place}`, origin)
  }
}