import fs from 'fs'
import path from "path"
import { config } from "../bot.js"
import capcon from "capture-console"

import strftime from './strftime.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname);
function checkFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
    // log(`! Folder ${folder} not found`)
  }
}
function checkFile(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content)
    // log(`! File ${file} not found`)
  }
}

checkFolder(`logs/console-logs`)
checkFile(`logs/console-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`, "\n")

export function log(text, next) {
  let logs
  if (!config.settings.log) return
  if (typeof (text) == "string" && text != "") {
    let content = `${text} | ${strftime('%d-%m-%Y', new Date())}`
    console.log(content)
    checkFolder(`logs/event-logs`)
    checkFile(`logs/event-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`, "\n")
    fs.appendFileSync(`logs/event-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`, `${content}\n`, { flag: "a+" });
  }
}

export function logMessage(text, next) {
  let logs
  let path = `logs/message-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`
  if (!config.settings.log) return
  if (typeof (text) == "string" && text != "") {
    let content = `${text} | ${strftime('%d-%m-%Y', new Date())}`
    console.log(content)
    checkFolder(`logs/message-logs`)
    checkFile(path, "\n")
    fs.appendFileSync(path, `${content}\n`, { flag: "a+" });
  }
}

export function advLog(text, type, prefix) {
  let logs
  let path = `logs/${type}-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`
  if (!config.settings.log) return
  if (typeof (text) == "string" && text != "") {
    let content = `${prefix}${prefix ? " " : ""}[${strftime('%H:%M', new Date())}] ${text}`
    // console.log(content)
    checkFolder(`logs/${type}-logs`)
    checkFile(path, "\n")
    fs.appendFileSync(path, `${content}\n`, { flag: "a+" });
  }
}

export function getLogPath(type) {
  return `logs/${type}-logs/${strftime('%d-%m-%Y', new Date())}-log.txt`
}

capcon.startCapture(process.stdout, (stdout, encoding, fd) => {
    advLog(`${stdout.replace(/\n$/, '')}`, "console", "•")
});
capcon.startCapture(process.stderr, (stdout, encoding, fd) => {
    advLog(`${stdout.replace(/\n$/, '')}`, "console", "!")
});