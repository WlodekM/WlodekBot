
// stop()
import Bot from "meowerbot";
import { exec } from "child_process";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";
import { log } from "./libs/logs.js";
import fs from 'fs'
import { input as consoleInput } from "./libs/consoleInput.js"
import { createInterface } from 'readline';
import path from "path"
import { events, activeEvents } from "./libs/events.js";
import { applyRules } from "./libs/events/uwu.js";
import { scan as scanCommands } from "./commands/commandManager.js";
import { website } from "./www/website.js";
import { welcome } from "./libs/start/welcome_message.js";

const allCommands = await scanCommands()

// commands
import { updateCommand } from "./commands/updateCommand.js";
import { message as wordleCommand } from "./commands/wordle/command.js"

dotenv.config();
export let config, configAuth
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

const delay = ms => new Promise(res => setTimeout(res, ms));

export const update = config.bot.update
const username = configAuth.bot.username;
const password = configAuth.bot.password;
const API = config.urls.api;
const prefix = "@" + username
const uptime = new Date().getTime();
let rl

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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getunix() {
  return (Math.floor(Date.now() / 1000))
}
function toTitleCase(text) {
  return text.toLowerCase().replace(
    /(?<!\S)\S/ug, match => match.toUpperCase()
  );
}

export const db = new JSONdb("./db/db.json");
export const shop = new JSONdb("./db/shop.json");
export const invites = new JSONdb("./commands/gcInvite/invites.json")
export const bot = new Bot()
const admins = config.bot.admins;
const server = config.urls.server
bot.version = update.version
bot.update = update
//express (website)

if (config.settings.website) website()

const checkFiles = () => {
  function checkFile(file, content) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, content)
      log(`! File ${file} not found`)
    }
  }
  checkFile("stores/ulist.txt", "")
  // checkFile("logs.txt", "")

  checkFile("db/db.json", "{}")
  checkFile("db/invites.json", "{}")
  checkFile("db/messages.json", "{}")
  checkFile("db/shop.json", "{}")

  checkFile("config/config.json", "{}")
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

    if (activeEvents.includes("uwu")) {
      bot.post = events.uwu.post
    }

    // yay command!
    if (isCommand) {
      if (!config.settings.consoleInput) console.log(`${user} is using the command ${command}`)
      log(`${user} used the command ${command}`)
      if (db.get(`${user}-ban-end`) >= getunix()) {
        var cooldown_left = db.get(`${user}-ban-end`) - getunix()
        bot.post(`You are banned for ${db.get(`${user}-ban-reason`)} for ${cooldown_left} more second${cooldown_left = 1 ? "s" : ""}`, origin)
      } else {
        var commandParams = { user, message, origin, command, args, bot }
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
          function checkForCommand(commandName) {
            let command = null
            let commands = {}
            // console.log("Checking for commands", Object.keys(allCommands).length)
            for (const key in allCommands) {
              if (Object.hasOwnProperty.call(allCommands, key)) {
                const element = allCommands[key];
                // console.log(`${commandName} == ${element.command}`)
                if (commandName == element.command || element.aliases.includes(commandName)) {
                  command = element
                  break
                }
              }
            }
            if (!command) return bot.post(`Command "${commandName}" not found!`, origin)
            console.log(`Found command that matches ${commandName} (${command.command})`)
            command.func(
              { user, message, origin, commandName, args, bot }
            )
          }
          checkForCommand(command)
        }
      }
    }

  });

  bot.onMessage((messageData) => {
    if (messageData.cmd == "pmsg") {
      bot.send_packet({ cmd: "pmsg", val: "I:100 | Bot", id: messageData.origin })
    }
    if (config.settings.logCL == "true") { log(`[CL] ${messageData} (${config.settings.logCL})`); }
    var JSONdata = JSON.parse(messageData)
    switch (JSONdata["cmd"]) {
      case ("ulist"):
        fs.writeFileSync("stores/ulist.txt", JSON.stringify(JSONdata["val"].split(";").slice(0, -1)))
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
    welcome()
    log(`: Logged on as user ${username}`)
  });
} catch (erroring) {
  log(`! Error! ${erroring}`)
  bot.login(username, password, server)
}
bot.login(username, password, server)