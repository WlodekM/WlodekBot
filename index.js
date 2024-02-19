import { exec } from "child_process";
import { runBot } from "./bot.js";
import { website } from "./www/website.js";

exec("npm install", ()=>{
    runBot()
    website()
})

/// uh