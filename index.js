
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
import { input as consoleInput } from "./libs/consoleInput.js"
import { createInterface } from 'readline';

// commands
import { joke }                   from "./commands/joke.js"
import { balCommand }             from "./commands/balCommand.js"
import { buyCommand }             from "./commands/buyCommand.js"
import { httpCommand }            from "./commands/http.js"
import { shopCommand }            from "./commands/shopCommand.js"
import { workCommand }            from "./commands/workCommand.js";
import { roastCommand }           from "./commands/roastCommand.js";
import { whoisCommand }           from "./commands/whoisCommand.js";
import { ulistCommand }           from "./commands/ulistCommand.js";
import { inventoryCommand }       from "./commands/inventoryCommand.js";
import { leaderboardCommand }     from "./commands/leaderboardCommand.js";
import { help as helpCommand }    from "./commands/help.js"

dotenv.config();
export let config, configAuth
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
let rl

export const help = {
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
export const commandTags = {
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
  commandTags[element] = ["ADMIN"]
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
    .map((p) => `${p[0]} - ${p[1]}${config.settings.economy.currency}`)
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

export const db = new JSONdb("./db.json");
export const shop = new JSONdb("./shop.json");
export const bot = new Bot()
const admins = config.bot.admins;
const server = config.urls.server
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
      if(!config.settings.consoleInput) console.log(`${user} is using the command ${command}`)
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
          var commandParams = {user, message, origin, command, args}
          switch (command) {
            case ("help"):
              helpCommand(commandParams)
              break;
            case ("ping"):
              bot.post(`Hello, i'm ${username} - a multipurpose bot!\nMy prefix is "@${username}" use "@${username} help" to find out about my commands`, origin)
              break;
            case ("http"):
              httpCommand(commandParams)
            case ("balance"):
              balCommand(commandParams)
              break;
            case ("buy"):
              buyCommand(commandParams)
              break;
            case ("joke"):
              joke(commandParams)
              break;
            case ("roast"):
              roastCommand(commandParams)
              break;
            case ("inv"):
            case ("inventory"):
              inventoryCommand(commandParams)
              break;
            case ("shop"):
              shopCommand(commandParams)
              break;
            case ("lb"):
            case ("top"):
            case ("leader"):
            case ("leaderboard"):
              leaderboardCommand(commandParams)
              break;
            case ("work"):
              workCommand(commandParams)
              break;
            case ("info"):
            case ("botinfo"):
              bot.post(`Source code: https://replit.com/@WlodekM/WlodekBot\nMy website: https://wlodekbot.wlodekm.repl.co\nCreator: WlodekM (fir)\nWLodekBot will be soon going offline due to the recent replit chages, if you know an alternitive to replit hosting, please DM @WlodekM3`, origin)
              break;
            case ("userlist"):
              ulistCommand(commandParams)
              break;
            case ("whois"):
              whoisCommand(commandParams)
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
    log(`[CL] ${messageData}`);
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
    rl.close()
    log(`: Bot died`)
    delay(1500);
    bot.login(username, password, server)
  });
  bot.onLogin(() => {
    log(`: Logged on as user ${username}`)
    welcome_messages.sync()
    var messages = welcome_messages.get("verified")
    var random_message = messages[Math.floor(Math.random() * messages.length)].replaceAll("${username}", username)
    // var random_message = "$(lnCount)$ test"
    fs.readFile('index.js', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      random_message=random_message.replaceAll("$(lnCount)$", String(data.split('\n').length))
      config.settings.welcomeMessages.forEach((a, i) => {
        bot.post(`${random_message}\nBot version: ${update.version}`, a);
      })
      bot.send(
        {
          "cmd": "direct",
          "val": {
            "cmd": "update_config",
            "val": {
              "quote": `v${update.version} | ${String(data.split('\n').length)} lines of code | ${random_message}`
            }
          },
          "listener": "listener_1538442"
        }
      )
    });
    
    rl = (async () => {consoleInput(createInterface({
      input: process.stdin,
      output: process.stdout
    }),bot,username)})()
  });
} catch (erroring) {
  log(`! Error! ${erroring}`)
  throw new Error(erroring);
}
bot.login(username, password, server)