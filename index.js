
// stop()
import Bot from "meowerbot";
import { exec } from "child_process";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import { log } from "./libs/logs.js";
import fs from 'fs'
import express from 'express'
import { input as consoleInput } from "./libs/consoleInput.js"
import { createInterface } from 'readline';
import path from "path"
import { events, activeEvents } from "./libs/events.js";
import { applyRules } from "./libs/uwu.js";

// commands
import { joke } from "./commands/joke.js"
import { balCommand } from "./commands/balCommand.js"
import { buyCommand } from "./commands/buyCommand.js"
import { httpCommand } from "./commands/http.js"
import { shopCommand } from "./commands/shopCommand.js"
import { workCommand } from "./commands/workCommand.js";
import { roastCommand } from "./commands/roastCommand.js";
import { whoisCommand } from "./commands/whoisCommand.js";
import { ulistCommand } from "./commands/ulistCommand.js";
import { updateCommand } from "./commands/updateCommand.js";
import { inviteCommand } from "./commands/gcInvite/command.js";
import { inventoryCommand } from "./commands/inventoryCommand.js";
import { leaderboardCommand } from "./commands/leaderboardCommand.js";
import { help as helpCommand } from "./commands/help.js"
import { message as wordleCommand } from "./commands/wordle/command.js"
import { bridgeCommand, OnMessage as uniMessage } from "./commands/uniBridge.js";
import { giveCommand } from "./commands/giveCommand.js"

dotenv.config();
export let config, configAuth
try {
  config = JSON.parse(fs.readFileSync('config.cfg', 'utf8'))
} catch (e) {
  console.error("No config file found, please crete a config file!");
  console.error(e);
  process.exit()
}
try {
  configAuth = JSON.parse(fs.readFileSync('config-auth.cfg', 'utf8'))
} catch (e) {
  console.error("No config-auth file found, please crete a config-auth file!");
  console.error(e);
  process.exit()
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const update = config.bot.update
const username = configAuth.bot.username;
const password = configAuth.bot.password;
const API = config.urls.api;
const prefix = "@" + username
const uptime = new Date().getTime();
let rl
let isReloaded = false

export const help = {
  "help": "Get info about my commands",
  "botinfo": "Get some info about me and my creator",
  "suggest": "Suggest a command",
  "changelog": "See what's new",
  "userlist": "Find out who's online",
  "andminlist": "List of all admins",
  "whois": "Get info about a user",
  "balance": "See how empty your wallet is",
  "work": `Earn money`,
  "leaderboard": "See who's №1",
  "shop": "See what you can buy",
  "buy": "Buy useless items",
  "rost": "Roast someone with my roasting skillz",
  "uniBridge": "WIP",
  "invite": "Make an invite to a group chat"
}
export const commandTags = {
  "help": ["BOT"],
  "botinfo": ["BOT"],
  "suggest": ["BOT"],
  "changelog": ["BOT"],
  "userlist": ["USER"],
  "adminlist": ["USER"],
  "whois": ["USER"],
  "roast": ["USER"],
  "balance": ["ECONOMY"],
  "work": ["ECONOMY"],
  "leaderboard": ["ECONOMY"],
  "shop": ["ECONOMY"],
  "buy": ["ECONOMY"],
  "invite": ["UTILITY"]
  // "uniBridge": ["OTHER"]
}
var commands = Object.keys(help)
const admincommands = [
  'eval',
  'shutdown',
  'restart',
  "update",
  "suggestions",
  "ban",
  "reset",
  "unban",
  "wordle",
  "shell",
  "uniBridge"
]
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
export const invites = new JSONdb("./commands/gcInvite/invites.json")
export const bot = new Bot()
const admins = config.bot.admins;
const server = config.urls.server
bot.version = update.version
const app = express()
const port = 3000;
//express (website)
const website = (() => {
  app.set('trust proxy', true)
  app.use((req, res, next) => {

    // -----------------------------------------------------------------------
    // authentication middleware
  
    const auth = {login: configAuth.web.u, password: configAuth.web.p}
  
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [login, pass] = Buffer.from(b64auth, 'base64').toString().split(':')
  
    // Verify login and password are set and correct
    if (login && pass && login === auth.login && pass === auth.password) {
      // Access granted...
      return next()
    }

    log(`# User at ${req.ip} tried to access website (Entered credentials: ${login}, ${pass})`)
  
    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message
  
    // -----------------------------------------------------------------------
  
  })
  app.get('/api', (req, res) => {
    res.send('Hello World!, the api is in progress')
  })
  app.get('/config', function (req, res) {
    fs.readFile('config.cfg', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      let respond = data
      respond = respond.split("\n").slice(-50).join("\n");
      respond = `\
      <head>\
      <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
      </head>
      <body>\
        <textarea rows="${respond.split("\n").length}" cols="200">
${respond}
        </textarea>
      <div id="end"></div></body>`
      res.send(respond)
    });
  });
  app.get('/logs', function (req, res) {
    function deHTML(input) {
      let dhout = input;
      dhout = dhout.replaceAll("&", "&amp;");
      dhout = dhout.replaceAll("<", "&lt;");
      dhout = dhout.replaceAll(">", "&gt;");
      dhout = dhout.replaceAll('"', "&quot;");
      dhout = dhout.replaceAll("'", "&apos;");
      return dhout;
    }
    fs.readFile('logs', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      let respond = data
      respond = respond.split("\n").slice(-50).join("\n");
      respond = `\
      <head>\
      <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
      </head><body>\
      ${deHTML(respond).replaceAll("\n", "<br>")}<div id="end"></div></body>`
      res.send(respond)
    });
  });
  app.get('/config', function (req, res) {
    function deHTML(input) {
      let dhout = input;
      dhout = dhout.replaceAll("&", "&amp;");
      dhout = dhout.replaceAll("<", "&lt;");
      dhout = dhout.replaceAll(">", "&gt;");
      dhout = dhout.replaceAll('"', "&quot;");
      dhout = dhout.replaceAll("'", "&apos;");
      return dhout;
    }
    fs.readFile('config.cfg', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      let respond = data
      respond = `\
      <head>\
      <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
      </head><body>\
      ${deHTML(respond).replaceAll("\n", "<br>")}<div id="end"></div></body>`
      res.send(respond)
    });
  })
  app.get('/postHome', (req, res) => {
    if (req.query["post"] == null) { res.send(`{"error":true,"type":"E:101 | Invalid arguments"}`); return }
    bot.post(`${req.query["post"]}`)
    res.send(`{"error":false"}`)
  });
  app.get('/messages', function (req, res) {
    res.send(welcome_messages.get("verified").join("<br>"))
  });
  app.get('/', function (req, res) {
    fs.readFile('ulist.txt', 'utf8', (err, data) => {
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
  app.get('/userlist', function (req, res) {
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
    // open("http://localhost:3000/", config.settings.browser);
  });
})
if (config.settings.website) website()

const checkFiles = () => {
  function checkFile(file, content) {
    if(!fs.existsSync(file)) {
      fs.writeFileSync(file, content)
      log(`! File ${file} not found`)
    }
  }
  checkFile("ulist.txt", "")
  checkFile("logs.txt", "")

  checkFile("db.json", "{}")
  checkFile("invites.json", "{}")
  checkFile("messages.json", "{}")
  checkFile("shop.json", "{}")

  checkFile("config.cfg", "{}")
}

// Check if files like logs.txt exist
checkFiles()

// ------------------------------------------------------------- //
try {
  bot.onPost((user, message, origin) => {
    function respond(text, origin) {
      if (text.split().length < 4000) {
        bot.post(text, origin)
        return;
      }
      bot.post(text.slice(3996) + "...")
    }
    // log post
    if (!origin) {
      log(`${user}: ${message} (in home)`)
    } else if (origin == "livechat") {
      log(`${user}: ${message} (in ${origin})`)
    }
    //check if it is a command
    var isCommand = message.split(" ")[0] == (prefix) || message.split(" ")[0] == `${prefix}#0000` || message.startsWith("@wb")
    let command = message.split(" ")[1]
    if (command != null) {
      command = command.toLowerCase()
    } else {
      command = "mention"
    }
    var args = message.split(" ")
    args = args.splice(1).splice(1)
    message = message.split(" ")

    if(activeEvents.includes("uwu")) {
      bot.post = events.uwu.post
    }


    uniMessage(message, origin, user)

    // console.log(`Message! ${message} : ${isCommand} :${args}`) // debug

    if (user == "Server") return

    if (user != username && origin == config.settings.cmdGC) {
      exec(message, (error, stdout, stderr) => {
        if (error) {
          bot.post(`**Error (exec)**\n\`\`\`\n${error.message.replaceAll("`", "\\\`")}\n\`\`\``, origin);
          return;
        }
        if (stderr) {
          bot.post(`**Error (shell)**\n\`\`\`\n${stderr.replaceAll("`", "\\\`")}\n\`\`\``, origin);
          return;
        }
        bot.post(`**Success**\n\`\`\`\n${stdout.replaceAll("`", "\\\`")}\n\`\`\``, origin);
      });
    }

    // yay command!
    if (isCommand) {
      if (!config.settings.consoleInput) console.log(`${user} is using the command ${command}`)
      log(`${user} used the command ${command}`)
      if (db.get(`${user}-ban-end`) >= getunix()) {
        var cooldown_left = db.get(`${user}-ban-end`) - getunix()
        bot.post(`You are banned for ${db.get(`${user}-ban-reason`)} for ${cooldown_left} more second${cooldown_left = 1 ? "s" : ""}`, origin)
      } else {
        var commandParams = { user, message, origin, command, args }
        // var mentioned_user = args[0].replaceAll("@","")
        if (admins.includes(user) && admincommands.includes(command)) { //Admin commands
          switch (command) {
            case ("eval"):
              if (args.length == 0) {
                bot.post(`[ℹ︎] Cannot evaluate "${args.join(" ")}"!`, origin)
                return
              }
              try {
                var evaluated = eval(args.join(" "))
                bot.post(`[✔︎] Evaluation success!\n${evaluated}`, origin)
              } catch (err) {
                bot.post(`[⚠︎] Evaluation failed!\n${err}`, origin)
              }
              break;
            case ("ban"):
              db.sync()
              if (Number(args[1]) == args[1]) {
                if (args.length > 2) {
                  var reason = args.slice(2).join(" ")
                  var time = getunix() + Number(args[1])
                  var banneduser = args[0]
                  db.set(`${banneduser}-ban-end`, time)
                  db.set(`${banneduser}-ban-reason`, reason)
                }
              }
              break;
            case ("wordle"):
              let wordleArgs = (args.splice(1))
              let wordleCommandCommand = (args[0])
              let wordleCommandArgs = { user, message, origin, wordleCommandCommand, wordleArgs }
              wordleCommand(wordleCommandArgs)
              break;
            case ("unban"):
              db.sync()
              if (args.length > 0) {
                var banneduser = args[0]
                db.set(`${banneduser}-ban-end`, 0)
              }
              break;
            case ("reset"):
              db.sync()
              if (args.length > 0) {
                var resetuser = args[0]
                db.set(`${resetuser}-money`, 0)
              }
              break;
            case ("shell"):
              exec(args.join(" "), (error, stdout, stderr) => {
                if (error) {
                  respond(`**Error (exec)**\n\`\`\`\n${error.message.replaceAll("`", "\\\`")}\n\`\`\``, origin);
                  return;
                }
                if (stderr) {
                  respond(`**Error (shell)**\n\`\`\`\n${stderr.replaceAll("`", "\\\`")}\n\`\`\``, origin);
                  return;
                }
                respond(`**Success**\n\`\`\`\n${stdout.replaceAll("`", "\\\`")}\n\`\`\``, origin);
              });
              break;
            case ("update"):
              updateCommand(commandParams);
              break;
            case ("shutdown"):
              log(`: Bot was shutdown by ${user}`)
              bot.post(`Shutting down, goodbye!`)
              delay(1500);
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
              delay(1500);
              process.exit(1)
              break;
            case ("ub"):
              bridgeCommand(commandParams)
              break;
          }
        } else {
          function checkForCommand(command, isUwU=false) {
            // console.log(isUwU ? applyRules("help")        : "help")
            switch (command) {
              case (isUwU ? applyRules("help")        : "help"):
                helpCommand(commandParams)
                break;
              case (isUwU ? applyRules("invite")      : "invite"):
                inviteCommand(commandParams)
                break;
              case (isUwU ? applyRules("mention")     : "mention"):
                bot.post(`Hello, i'm ${username} - a multipurpose bot!\n\
                My prefix is \`@${username}\` use \`@${username} help\` to find out about my commands`, origin)
                break;
              case (isUwU ? applyRules("http")        : "http"):
                httpCommand(commandParams)
                break;
              case (isUwU ? applyRules("balance")     : "balance"):
                balCommand(commandParams)
                break;
              case (isUwU ? applyRules("buy")         : "buy"):
                buyCommand(commandParams)
                break;
              case (isUwU ? applyRules("joke")        : "joke"):
                joke(commandParams)
                break;
              case (isUwU ? applyRules("roast")       : "roast"):
                roastCommand(commandParams)
                break;
              case (isUwU ? applyRules("inv")         : "inv"):
              case (isUwU ? applyRules("inventory")   : "inventory"):
                inventoryCommand(commandParams)
                break;
              case (isUwU ? applyRules("shop")        : "shop"):
                shopCommand(commandParams)
                break;
              case (isUwU ? applyRules("lb")          : "lb"):
              case (isUwU ? applyRules("top")         : "top"):
              case (isUwU ? applyRules("leader")      : "leader"):
              case (isUwU ? applyRules("leaderboard") : "leaderboard"):
                leaderboardCommand(commandParams)
                break;
              case (isUwU ? applyRules("work")        : "work"):
                workCommand(commandParams)
                break;
              case (isUwU ? applyRules("give")        : "give"):
                giveCommand(commandParams)
                break;
              case (isUwU ? applyRules("info")        : "info"):
              case (isUwU ? applyRules("botinfo")     : "botinfo"):
                bot.post(`Source code: https://github.com/WlodekM/WlodekBot\n\
                Creator: @WlodekM3\n\
                Uptime: [WIP]`, origin)
                break;
              case (isUwU ? applyRules("userlist")    : "userlist"):
                ulistCommand(commandParams)
                break;
              case (isUwU ? applyRules("whois")       : "whois"):
                whoisCommand(commandParams)
                break;
              case (isUwU ? applyRules("suggest")     : "suggest"):
                welcome_messages.sync()
                if (args) {
                  bot.post(`${user} - ${args.join(" ")}`, config.settings.suggestGC)
                } else {
                  bot.post("You need to suggest something", origin)
                }
                break;
              case (isUwU ? applyRules("adminlist")   : "adminlist"):
                bot.post(`My admins are: ${admins.join(", ")}`, origin)
                break;
              case (isUwU ? applyRules("changelog")   : "changelog"):
                bot.post(`# === ${bot.version} ===\n${update.changelog}`, origin)
                break;
              default:
                if(!isUwU) {
                  checkForCommand(command, true)
                  return false
                }
                if (admincommands.includes(command)) {
                  bot.post(`Command "${command}" is admin-only`, origin)
                } else {
                  bot.post(`Command "${command}" was not found`, origin)
                }
                break;
            }
          }
          checkForCommand(command, false)
        }
      }
    }

  });

  bot.onMessage((messageData) => {
    if (messageData.cmd == "pmsg") { 
       bot.send_packet({cmd:"pmsg", val:"I:100 | Bot", id: messageData.origin})
    }
    if (config.settings.logCL == "true") { log(`[CL] ${messageData} (${config.settings.logCL})`); }
    var JSONdata = JSON.parse(messageData)
    switch (JSONdata["cmd"]) {
      case ("ulist"):
        fs.writeFileSync("ulist.txt", JSON.stringify(JSONdata["val"].split(";").slice(0, -1)))
      case ("statuscode"):
        if (JSONdata["val"].includes("E")) {
          log(`! ${JSONdata["val"]}`)
        }
    }
  });

  bot.onClose(() => {
    console.log('bot is ded');
    // rl.close()
    log(`: Bot died`)
    isReloaded = true
    delay(1500);
    bot.login(username, password, server)
  });
  bot.onLogin(() => {
    // use this code to read nu mber of lines in all js files

    function countLinesInFile(filePath) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return data.split('\n').length;
      } catch (err) {
        log(`! Error reading file ${filePath}: ${err}`);
        return 0;
      }
    }

    function readFilesInDirectory(directoryPath) {
      try {
        const files = fs.readdirSync(directoryPath);

        let totalLines = 0;

        files.forEach(file => {
          const filePath = path.join(directoryPath, file);
          try {
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
              // Handle directories if needed
            } else if (stats.isFile() && path.extname(file) === '.js') {
              // Process only .js files
              const lines = countLinesInFile(filePath);
              totalLines += lines;
              // console.log(`File: ${filePath}, Lines: ${lines}`);
            }
          } catch (err) {
            log(`! Error processing file ${filePath}: ${err}`);
          }
        });

        return totalLines;
      } catch (err) {
        log(`! Error reading files: ${err}`);
        return 0;
      }
    }
    let lines = readFilesInDirectory("commands/")
    // const files = fs.readdirSync("");
    let mainFileLength = String(fs.readFileSync('index.js')).split('\n').length

    // console.log(lines, mainFileLength, lines + mainFileLength)

    lines = + mainFileLength


    log(`: Logged on as user ${username}`)
    welcome_messages.sync()
    var messages = welcome_messages.get("verified")
    var random_message = messages[Math.floor(Math.random() * messages.length)].replaceAll("${username}", username)
    // var random_message = "$(lnCount)$ test"
    random_message = random_message.replaceAll("$(lnCount)$", String(lines))
    // udate quote
    bot.send(
      {
        "cmd": "direct",
        "val": {
          "cmd": "update_config",
          "val": {
            "quote": `v${update.version} | ${String(lines)} lines of code | ${random_message}`
          }
        }
      }
    )
    if (isReloaded) return // showier angy
    config.settings.welcomeMessages.forEach((a, i) => {
      bot.post(`${random_message}\nBot version: ${update.version}`, a);
    })
    rl = (async () => {
      consoleInput(createInterface({
        input: process.stdin,
        output: process.stdout
      }), bot, username)
    })()
  });
} catch (erroring) {
  log(`! Error! ${erroring}`)
  bot.login(username, password, server)
}
bot.login(username, password, server)