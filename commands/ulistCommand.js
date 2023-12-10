import {bot} from "../index.js"
import fs from "fs"

export function ulistCommand({user, message, origin, command, args}) {
    fs.readFile('ulist.txt', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        var userlist = JSON.parse(data)
        bot.post(`There are currently ${userlist.length} user(s) online (${userlist.join(", ")}).`, origin)
    });
}