import JSONdb from "simple-json-db";
import fs from "fs";
const db = new JSONdb("./db/db.json");
import http from "https"
import { adminPermissions } from "../libs/bitField.js"

let config, configAuth
try {
  config = JSON.parse(fs.readFileSync('config/config.json', 'utf8'))
} catch (e) {
  console.error("No config file found, please crete a config file!");
  console.error(e);
  process.exit()
}
try {
  configAuth = JSON.parse(fs.readFileSync('config/auth.json', 'utf8'))
} catch (e) {
  console.error("No config-auth file found, please crete a config-auth file!");
  console.error(e);
  process.exit()
}

export default {
  command: "whois",
  aliases: [],    
  async func({ user, message, origin, command, args, bot }) {
    if (args.length < 1) return bot.post(`No user specified (args length: ${args.length})`, origin)
    args[0] = args[0].replaceAll("@", "")
    var result
    var userInfo = await fetch(`https://${config.urls.api}/users/${args[0]}`)
    // console.log(userInfo.text());
    try { result = await userInfo.json() } catch (e) {
      console.error(e)
      return bot.post(`Cant parse JSON, aborting`, origin)
    }
    console.log(result)
    if (!result) return bot.post(`Error`, origin)
    if (result["error"]) return bot.post(`User ${args[0]} not found, check your spelling and try again`, origin)
    if (args[1] == "debug") bot.post(JSON.stringify(result), origin)
    if (args[1] == "pfp") return bot.post(`[.png: https://assets.meower.org/PFP/${result["pfp_data"] - 1}.png ]`, origin)
    var resa = await fetch(`https://${config.urls.api}/users/${args[0]}/posts?autoget`)

    var postspagee = await resa.json()
    if (args[1] == "debug") {
      bot.post(postspagee, origin)
    }
    var postspage = "None"
    if (postspagee["pages"] > 0) postspage = postspagee["pages"]
    var topost = []
    var theurl = `https://${config.urls.api}/users/${args[0]}/posts?autoget`
    if (postspage != "None") theurl = `https://${config.urls.api}/users/${args[0]}/posts?autoget&page=${postspage}`
    let resultPosts = await fetch(theurl)
    function getKeyByValue(object, value) {
      return Object.keys(object).find(key => object[key] === value);
    }
    // console.log(resultPosts);
    if (postspage != "None") {
      resultPosts = await resultPosts.json() // Will re-do from scratch later
      if (resultPosts["error"]) resultPosts = "Error"
      if (args[1] == "debug") bot.post(`${JSON.stringify(resultPosts)}:${resultPosts}`, origin)
      resultPosts = resultPosts["autoget"]
      resultPosts = resultPosts[resultPosts.length - 1]
    }
    var badges = db.get(`${result["_id"]}-badges`)
    topost.push(`#  ${result["_id"]}${badges ? " " : ""}${badges ? badges : ""}`)
    if (result["banned"]) {
      topost.push(`> Banned: yes`)
    } else {
      topost.push(`> Banned: no`)
    }
    let permissions = getKeyByValue(adminPermissions, result["permissions"])
    topost.push(`> Permissions: ${permissions}(Raw: ${result["permissions"]})`)

    if (result["quote"]) { topost.push(`> Quote: ${result["quote"]}`) }
    topost.push(`> PFP №: ${result["pfp_data"]}`)
    // topost.push(`Theme: ${result["theme"]}`)
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(result["created"] * 1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();

    // Will display time in 10:30:23 format
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    topost.push(`> Created: ${date.toDateString()} at ${formattedTime}`)
    if (postspage != "None") topost.push(`> First post: ${resultPosts["p"]}`)
    // topost.push(`====${"=".repeat(args[0].length)}====`)
    bot.post(topost.join("\n"), origin)
  }
}