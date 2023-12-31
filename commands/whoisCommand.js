import { bot, db, config } from "../index.js"
import http from "https"
import { adminPermissions } from "../libs/bitField.js"

export async function whoisCommand({ user, message, origin, command, args }) {
  if (args.length < 1) return bot.post(`No user specified`, origin)
  args[0] = args[0].replaceAll("@", "")
  var userinfo
  var userInfo = await fetch(`https://${config.urls.api}/users/${args[0]}`)
  // console.log(result);
  console.log(result);
  try { result = userInfo.json() } catch (e) {
    return bot.post(`Cant parse JSON, aborting`, origin)
  }
  if (result) return bot.post(`Error`, origin)
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
  var resultPosts = await fetch(theurl)
  function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }
  // console.log(resultposts);
  if (postspage != "None") {
    resultposts = resultPosts.json() // Will re-do from scratch later
    if (resultposts["error"]) resultposts = "Error"
    if (args[1] == "debug") bot.post(`${JSON.stringify(resultposts)}:${resultposts}`, origin)
    resultposts = resultposts["autoget"]
    resultposts = resultposts[resultposts.length - 1]
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
  if (postspage != "None") topost.push(`> First post: ${resultposts["p"]}`)
  // topost.push(`====${"=".repeat(args[0].length)}====`)
  bot.post(topost.join("\n"), origin)
}