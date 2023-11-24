
// stop()
import Bot from "meowerbot";
import fetch from "node-fetch";
import { exec } from "child_process";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import path from "path";
import { log } from "./libs/logs.js";
import fs from 'fs'
import http from "https"
import express from 'express'

// commands
import { joke } from "./commands/joke.js"

dotenv.config();
var config, configAuth
try {
  config = JSON.parse(fs.readFileSync('config.cfg', 'utf8'))
} catch(e) {
  console.error("No config file found, please crete a config file!");
  console.error(e);
  process.exit()
}
try {
  configAuth = JSON.parse(fs.readFileSync('config-auth.cfg', 'utf8'))
} catch(e) {
  console.error("No config-auth file found, please crete a config-auth file!");
  console.error(e);
  process.exit()
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const update = config.bot.update
const username =  configAuth.bot.username;
const password = configAuth.bot.password;
const API = config.urls.api;
const prefix = "@" + username
const uptime = new Date().getTime();

const help = {
  "help":        "Get info about my commands",
  "botinfo":     "Get some info about me and my creator",
  "suggest":     "Suggest a command",
  "changelog":   "See what's new",
  "userlist":    "Find out who's online",
  "andminlist":  "List of all admins",
  "whois":       "Get info about a user",
  "balance":     "See how empty your wallet is",
  "work":        `Earn money`,
  "leaderboard": "See who's №1",
  "shop":        "See what you can buy",
  "buy":         "Buy useless items",
  "rost":        "Roast someone with my roasting skillz",
}
const commandtags = {
  "help":                  ["BOT"],
  "botinfo":               ["BOT"],
  "suggest":               ["BOT"],
  "changelog":             ["BOT"],
  "userlist":              ["USER"],
  "adminlist":             ["USER"],
  "whois":                 ["USER"],
  "roast":                 ["USER"],
  "balance":               ["ECONOMY"],
  "work":                  ["ECONOMY"],
  "leaderboard":           ["ECONOMY"],
  "shop":                  ["ECONOMY"],
  "buy":                   ["ECONOMY"],
}
var commands = Object.keys(help)
const admincommands = ['eval', 'shutdown', 'restart', "update", "suggestions","ban","reset","unban"]
const adminlevels = [
  "User",
  "Lower moderator",
  "Moderator",
  "Admin",
  "System admin"
]
admincommands.forEach(element => {
  commandtags[element] = ["ADMIN"]
});
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function leaderboard(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p, index) => `${index + 1}: ${p[0]} - ${p[1]}`)
    .join("\n");
  return (result)
}
function formatshop(userscores) {
  let result = Object.entries(userscores)
    .sort((a, b) => b[1] - a[1])
    .map((p) => `${p[0]} - ${p[1]}${db.get("currency")}`)
    .join("\n");
  return (result)
}
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
function getunix() {
  return (Math.floor(Date.now() / 1000))
}
function toTitleCase(text) {
  return text.toLowerCase().replace(
    /(?<!\S)\S/ug, match => match.toUpperCase()
  );
}


const welcome_messages = new JSONdb("./messages.json");

const admins = config.bot.admins;
const db = new JSONdb("./db.json");
const place = new JSONdb("./place.json");
const karma = new JSONdb("./karma.json");
const ips = new JSONdb("./ips.json");
const shop = new JSONdb("./shop.json");
const server = config.urls.server
const bot = new Bot()
bot.version = update.version
const app = express()
const port = 3000;
//express (website)
var website = (()=>{
  app.set('trust proxy', true)
  app.get('/api', (req, res) => {
    res.send('Hello World!, the api is in progress')
  })
  app.get('/api/send/home', (req, res) => {
    // if(req.ip!=process.env['blockedip']){
    //   ips.set(req.query["user"],req.ip)
    // }
    if (req.query["user"] != null) {
      if (req.query["post"] != null) {
        bot.post(`${req.query["user"]}:${req.query["post"]}`)
        res.send(`{"error":false"}`)
      } else {
        res.send(`{"error":true,"type":"E:101 | Invalid arguments"}`)
      }
    } else {
      res.send(`{"error":true,"type":"E:101 | Invalid arguments"}`)
    }
  })
  app.get('/logs', function(req, res) {
    fs.readFile('logs', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      var respond = data.replaceAll("\n", "<br>")
      respond = `\
      <head>\
      <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
      <head><body>\
      ${respond}<div id="end">`
      res.send(respond)
    });
  });
  app.get('/messages', function(req, res) {
    res.send(welcome_messages.get("verified").join("<br>"))
  });
  app.get('/', function(req, res) {
    fs.readFile('ulist', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      var userlist = JSON.parse(data)
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
      fs.readFile('public/index_a.htm', 'utf8', (err, data1) => {
        var data2 = data1.replaceAll("[ULIST]", `<li>${userlist.join("</li>\n<li>")}</li>`)
        data2 = data2.replaceAll("[LB]", `<ol><li>${leaderboardarray(money_leaderboard).join("</li>\n<li>")}</li></ol>`)
        data2 = data2.replaceAll("[UPDATE]", `\
        <h5 id="padding1">${update.version}</h5>\
        <p id="paddingleft1">${update.changelog.replaceAll("\n", "<br>")}</p>`)
        res.send(data2);
      });
    });
  });
  app.get('/userlist', function(req, res) {
    fs.readFile('ulist', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      var userlist = JSON.parse(data)
      var result = `<li>${userlist.join("</li>\n<li>")}</li>`
      res.send(result);
    });
  });
  app.use(express.static('public'));
  app.listen(port, () => {
    console.log(`The website is up and is on port ${port}`)
  });
})
if (config.settings.website) website()

// ------------------------------------------------------------- //
try {
  bot.onPost(async (user, message, origin) => {
    // log post
    if (!origin) {
      log(`${user}: ${message} (in home)`)
    } else if (origin == "livechat") {
      log(`${user}: ${message} (in ${origin})`)
    }
    //check if it is a command
    var isCommand = message.startsWith(prefix) || message.startsWith("@wb")
    let command = message.split(" ")[1]
    if(command != null) {
      command = command.toLowerCase()
    } else {
      command = "ping"
    }
    var args = message.split(" ")
    args = args.splice(1).splice(1)
    message = message.split(" ")

    // console.log(`Message! ${message} : ${isCommand} :${args}`) // debug
    
    
    // yay command!
    if (isCommand) {
      console.log(`${user} is using the command ${command}`)
      log(`${user} used the command ${command}`)
      if (db.get(`${user}-ban-end`) >= getunix()) {
        var cooldown_left = db.get(`${user}-ban-end`) - getunix()
        bot.post(`You are banned for ${db.get(`${user}-ban-reason`)} for ${cooldown_left} more second${cooldown_left = 1 ? "s" : ""}`, origin)
      } else {
        // var mentioned_user = args[0].replaceAll("@","")
        if (admins.includes(user) && admincommands.includes(command)) { //Admin commands
          switch (command) {
            case ("eval"):
              if(args.length == 0) {
                bot.post(`[ℹ︎] Cannot evaluate "${args.join(" ")}"!`, origin)
                return
              }
              try {
                var evaluated = eval(args.join(" "))
                bot.post(`[✔︎] Evaluation succes!\n${evaluated}`, origin)
              } catch (err) {
                bot.post(`[⚠︎] Evaluation failed!\n${err}`)
              }
              break;
            case ("ban"):
              db.sync()
              if(Number(args[1]) == args[1]) {
                if(args.length > 2) {
                  var reason = args.slice(2).join(" ")
                  var time = getunix() + Number(args[1])
                  var banneduser = args[0]
                  db.set(`${banneduser}-ban-end`,    time)
                  db.set(`${banneduser}-ban-reason`, reason)
                }
              }
              break;
            case ("unban"):
              db.sync()
              if(args.length > 0) {
                var banneduser = args[0]
                db.set(`${banneduser}-ban-end`,    0)
              }
              break;
            case ("reset"):
              db.sync()
              if(args.length > 0) {
                var resetuser = args[0]
                db.set(`${resetuser}-money`,    0)
              }
              break;
            case ("update"):
            case ("shutdown"):
              log(`: Bot was shutdown by ${user}`)
              if (command == "update") {
                bot.post(`Updating... this can take up to 5 minutes`)
              } else {
                bot.post(`Shutting down, goodbye!`)
              }
              await delay(1500);
              throw new Error("Shut down")
  
            case ("suggestions"):
              welcome_messages.sync()
              switch (args[0]) {
                case ("approve"):
                  if (args[1] != null) {
                    var messages = welcome_messages.get("suggested")
                    if (messages.length >= args[1]) {
                      var aprooved_message = messages[Number(args[1])]
                      var temp = welcome_messages.get("suggested")
                      var index = Number(args[1])
                      if (index > -1) {
                        temp.splice(index, 1);
                      }
                      welcome_messages.set("suggested", temp)
                      var tempb = welcome_messages.get("verified")
                      tempb.push(aprooved_message)
                      welcome_messages.set("verified", tempb)
                      bot.post(`Message "${aprooved_message}" aprooved ; ${temp.join(",")}`, origin)
  
                    } else {
                      bot.post(`Message №${args[1]} not found`, origin)
                    }
                  } else {
                    bot.post(`You need to specify wich message to aproove!`, origin)
                  }
                  break;
                case ("deny"):
                  if (args[1] != null) {
                    var messages = welcome_messages.get("suggested")
                    if (messages.length >= args[1]) {
                      var aprooved_message = messages[Number(args[1])]
                      var temp = welcome_messages.get("suggested")
                      var index = Number(args[1])
                      if (index > -1) {
                        temp.splice(index, 1);
                      }
                      welcome_messages.set("suggested", temp)
                      bot.post(`Message "${aprooved_message}" denied`, origin)
  
                    } else {
                      bot.post(`Message №${args[1]} not found`, origin)
                    }
                  } else {
                    bot.post(`You need to specify wich message to deny!`, origin)
                  }
                  break;
                default:
                  bot.post(((welcome_messages.get("suggested").map((x, index) => `${index} ${x}`)).join("\n")), origin)
                  break;
              }
              break;
  
            case ("restart"):
              log(`: Bot was restarted by ${user}`)
              bot.post(`Restarting...`)
              await delay(1500);
              process.exit(1)
              break;
          }
        } else {
          switch (command) {
            case ("help"):
              if (args[0] in help) {
                bot.post(help[args[0]], origin)
              } else {
                var msg = ""
                var hlep = []
                msg += `Hello, i'm ${username} - a multipurpose bot!\nHere are my commands:`
                for (const key in commandtags) {
                  if (Object.hasOwnProperty.call(commandtags, key)) {
                    const element = commandtags[key];
                    if(hlep[element[0]] == null) {
                      hlep[element[0]] = []
                    }
                    hlep[element[0]].push(key)
                  }
                }
                for (const key in hlep) {
                  if (Object.hasOwnProperty.call(hlep, key)) {
                    const element = hlep[key];
                    msg += "\n\n" + `=== ${key} ===` + "\n"
                    element.forEach(elementi => {
                      msg += elementi + " "
                    });
                  }
                }
                bot.post(msg, origin)
              }
              break;
            case ("ping"):
              bot.post(`Hello, i'm ${username} - a multipurpose bot!\nMy prefix is "@${username}" use "@${username} help" to find out about my commands`, origin)
              break;
            case ("http"):
              var httpmeow = {100: "Continue",101: "Switching Protocols",102: "Processing",103: "Early Hints",200: "OK",201: "Created",202: "Accepted",203: "Non-Authoritative Information",204: "No Content",205: "Reset Content",206: "Partial Content",207: "Multi-Status",208: "Already Reported",218: "This is fine",226: "IM Used",300: "Multiple Choices",301: "Moved Permanently",302: "Found",303: "See Other",304: "Not Modified",305: "Use Proxy",307: "Temporary Redirect",308: "Permanent Redirect",400: "Bad Request",401: "Unauthorized",402: "Payment Required",403: "Forbidden",404: "Not Found",405: "Method Not Allowed",406: "Not Acceptable",407: "Proxy Authentication Required",408: "Request Timeout",409: "Conflict",410: "Gone",411: "Length Required",412: "Precondition Failed",413: "Payload Too Large",414: "URI Too Long",415: "Unsupported Media Type",416: "Range Not Satisfiable",417: "Expectation Failed",418: "I'm a Teapot",420: "Enhance Your Calm",421: "Misdirected Request",422: "Unprocessable Entity",423: "Locked",424: "Failed Dependency",425: "Too Early",426: "Upgrade Required",428: "Precondition Required",429: "Too Many Requests",431: "Request Header Fields Too Large",451: "Unavailable For Legal Reasons",500: "Internal Server Error",501: "Not Implemented",502: "Bad Gateway",503: "Service Unavailable",504: "Gateway Timeout",505: "HTTP Version Not Supported",506: "Variant Also Negotiates",507: "Insufficient Storage",508: "Loop Detected",509: "Bandwidth Limit Exceeded",510: "Not Extended",511: "Network Authentication Required",
              };
              if(Object.keys(httpmeow).includes(String(args[0]))){
                bot.post(`[${args[0]}.jpg: https://http.meower.org/${args[0]} ]`)
              } else {
                var httpkeys = Object.keys(httpmeow)
                var random_http = httpkeys[Math.floor(Math.random() * httpkeys.length)]
                bot.post(`[${random_http}.jpg: https://http.meower.org/${random_http} ]`)
              }
              break;
            case ("balance"):
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
              break;
            case ("buy"):
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
              break;
            case ("joke"):
              joke(user, message, origin, command, args)
              break;
            case ("roast"):
              if(args[0].startsWith("@")) {
                fs.readFile('roasts.txt', 'utf8', (err, data) => {
                  var roasts = data.split("\n")
                  bot.post(
                    (args[0] + " " + roasts[Math.floor(Math.random() * roasts.length)]), origin
                  );
                });
              }
              break;
            case ("inv"):
            case ("inventory"):
              shop.sync()
              if (!db.has(`${user}-inventory`)) db.set(`${user}-inventory`, [])
              var userinventory = db.get(`${user}-inventory`)
              bot.post(`=== ${user}'s inventory ===\n${userinventory.join(",\n")}`)
              break;
            case ("shop"):
              db.sync()
              shop.sync()
              if (!db.has(`${user}-money`)) {
                db.set(`${user}-money`, 0)
              }
              bot.post(`${formatshop(shop.JSON())}`)
              break;
            case ("lb"):
            case ("top"):
            case ("leader"):
            case ("leaderboard"):
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
              break;
            case ("work"):
              db.sync();
              if (!db.has(`${user}-money`)) db.set(`${user}-money`, 0);
              if (!db.has(`${user}-work-cooldown`)) db.set(`${user}-work-cooldown`, 0);
              const cooldown = db.get(`${user}-work-cooldown`);
              if (cooldown <= getunix()) {
                  const moneyEarned = getRandomInt(16, 32);
                  const userMoney = db.get(`${user}-money`);
                  db.set(`${user}-money`, userMoney + moneyEarned);
                  db.set(`${user}-work-cooldown`, getunix() + 120);
                  bot.post(`You have earned ${moneyEarned}${db.get("currency")}`, origin);
              } else {
                  const cooldownLeft = cooldown - getunix();
                  bot.post(`You need to wait ${cooldownLeft} more second${cooldownLeft == 1 ? "" : "s"}`, origin);
              }
          
              db.sync();
              break;
            case ("info"):
            case ("botinfo"):
              bot.post(`Source code: https://replit.com/@WlodekM/WlodekBot\nMy website: https://wlodekbot.wlodekm.repl.co\nCreator: WlodekM (fir)\nWLodekBot will be soon going offline due to the recent replit chages, if you know an alternitive to replit hosting, please DM @WlodekM3`, origin)
              break;
            // case ("place"):
            //   switch (args[0]) {
            //     case ("place"):
            //       break;
            //     case ("view"):
            //     default:
            //       let resulta = place.JSON()
            //       let result = []
            //       for (const key in resulta) {
            //         if (Object.hasOwnProperty.call(resulta, key)) {
            //           const element = resulta[key];
            //           result.push(`${key} ${element}`)
            //         }
            //       }
            //       result = result.join("\n")
            //       result = `  1234567\n` + result
            //       bot.post(result, origin)
            //   }
            //   break;
            case ("userlist"):
              fs.readFile('ulist', 'utf8', (err, data) => {
                if (err) {
                  console.error(err);
                  return;
                }
                var userlist = JSON.parse(data)
                bot.post(`There are currently ${userlist.length} user(s) online (${userlist.join(", ")}).`, origin)
              });
              break;
            //Risky, if another bot has a say comand then spam is possible :(
            // cese("say"):
            //   bot.post(args.join(" "), origin)
            //   break;
            case ("whois"):
              if (args.length >= 1) {
                args[0] = args[0].replaceAll("@", "")
                var userinfo
                var result = '';
                const req = http.request(`https://${API}/users/${args[0]}`, (res) => {
                  // console.log(res.statusCode);
  
                  res.setEncoding('utf8');
                  res.on('data', (chunk) => {
                    result += chunk;
                  });
  
                  res.on('end', () => {
                    // console.log(result);
                    result = JSON.parse(result)
                    if (result["error"]) {
                      bot.post(`User ${args[0]} not found, check your spelling and try again`, origin)
                    } else {
                      if (args[1] == "debug") {
                        bot.post(JSON.stringify(result), origin)
                      }
                      if (args[1] == "pfp") {
                        bot.post(`[.png: https://assets.meower.org/PFP/${result["pfp_data"] - 1}.png ]`, origin)
                      } else {
                        var resa = fetch(`https://${API}/users/${args[0]}/posts?autoget`).then(resa => {
  
                          var postspagee = resa.json().then(postspagee => {
                            if (args[1] == "debug") {
                              bot.post(postspagee, origin)
                            }
                            var postspage
                            if (postspagee["pages"] > 0) {
                              postspage = postspagee["pages"]
                            } else {
                              postspage = "None"
                            }
                            // console.log(`Pages: ${postspage}`)
                            var topost = []
                            var resultposts = '';
                            var theurl
                            if (postspage != "None") {
                              var theurl = `https://${API}/users/${args[0]}/posts?autoget&page=${postspage}`
                            } else {
                              var theurl = `https://${API}/users/${args[0]}/posts?autoget`
                            }
                            const req = http.request(theurl, (res) => {
                              // console.log(res.statusCode);
  
                              res.setEncoding('utf8');
                              res.on('data', (chunk) => {
                                resultposts += chunk;
                              });
  
                              res.on('end', () => {
                                // console.log(resultposts);
                                if (postspage != "None") {
                                  resultposts = JSON.parse(resultposts)
                                  if (resultposts["error"]) {
                                    resultposts = "Error"
                                  }
                                  resultposts = resultposts["autoget"]
                                  if (args[1] == "debug") {
                                    bot.post(`${JSON.stringify(resultposts)}:${resultposts}`, origin)
                                  }
                                  resultposts = resultposts[resultposts.length - 1]
                                }
                                var badges = db.get(`${result["_id"]}-badges`)
                                topost.push(`=== ${result["_id"]}${badges ? " " : ""}${badges ? badges : ""} ===`)
                                if (result["banned"]) {
                                  topost.push(`Banned: yes`)
                                } else {
                                  topost.push(`Banned: no`)
                                }
                                let lvlusr = result["lvl"]
                                topost.push(`Level: ${lvlusr}(${adminlevels[lvlusr]})`)
  
                                if (result["quote"]) { topost.push(`Quote: ${result["quote"]}`) }
                                topost.push(`PFP №: ${result["pfp_data"]}`)
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
  
                                topost.push(`Created: ${date.toDateString()} at ${formattedTime}`)
                                if (postspage != "None") {
                                  topost.push(`First post: ${resultposts["p"]}`)
                                }
                                // topost.push(`====${"=".repeat(args[0].length)}====`)
                                bot.post(topost.join("\n"), origin)
                              });
                            });
  
                            req.on('error', (e) => {
                              console.error(e);
                            });
  
                            req.end();
                          });
                        });
                      }
                    }
                  });
                });
  
                req.on('error', (e) => {
                  console.error(e);
                });
  
                req.end();
              }
              break;
            case ("suggest"):
              welcome_messages.sync()
              if (args) {
                bot.post(`${user} - ${args.join(" ")}`, config.settings.suggestGC)
              } else {
                bot.post("You need to suggest something", origin)
              }
              break;
            case ("adminlist"):
              bot.post(admins.join(", "), origin)
              break;
            case ("changelog"):
              bot.post(`=== ${bot.version} ===\n${update.changelog}`, origin)
              break;
            default:
              if(admincommands.includes(command)) {
                bot.post(`Command "${command}" is admin-only`, origin)
              } else {
                bot.post(`Command "${command}" was not found`, origin)
              }
              break;
            }
          }
        }
      }
  
  });
  
  bot.onMessage((messageData) => {
    // if (messageData.cmd == "pmsg") { 
    //    bot.send_packet({cmd:"pmsg", val:"I:100 | Bot", id: messageData.origin})
    // }
    console.log(`New message: ${messageData}`);
    var JSONdata = JSON.parse(messageData)
    switch (JSONdata["cmd"]) {
      case ("ulist"):
        fs.writeFile("ulist", JSON.stringify(JSONdata["val"].split(";").slice(0, -1)), function(err) {
          if (err) {
            return console.error(err);
          }
        })
      case ("statuscode"):
        if (JSONdata["val"].includes("E")) {
          log(`! ${JSONdata["val"]}`)
        }
    }
  });
  
  bot.onClose(() => {
    console.log('bot is ded');
    log(`: Bot died`)
    delay(1500);
    process.exit(1)
  });
  bot.onLogin(() => {
    log(`: Logged on as user ${username}`)
    welcome_messages.sync()
    var messages = welcome_messages.get("verified")
    var random_message = messages[Math.floor(Math.random() * messages.length)].replaceAll("${username}", username)
    config.settings.welcomeMessages.forEach((a, i) => {
      bot.post(`${random_message}\nBot version: ${update.version}`, a);
    })
  });
} catch (erroring) {
  log(`! Error! ${erroring}`)
  throw new Error(erroring);
}
bot.login(username, password)