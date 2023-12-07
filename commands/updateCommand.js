import simpleGit from "simple-git";
import { bot } from "../index.js"
import { log } from "../libs/logs.js"

export function updateCommand({ user, message, origin, command, args }) {
    const git = simpleGit();
    try {
        const status = git.status();

        if (!status.isClean()) {
            log("! Git status isn't clean (whatever that means)")
            bot.post(`Update failed! Check log file for more info`, origin)
            return;
        }

        git.pull()

        bot.post("Update success! Restart the bot to finish updating.", origin)

    } catch (error) {
        log("! Error while trying to pull from git repo")
        bot.post(`Update failed! Check log file for more info`, origin)
        const status = git.status();

        if (status.conflicted.length > 0) {
            return;
        }

        console.log(error);
    }
}