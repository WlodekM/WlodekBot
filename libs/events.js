import { bot } from "../bot.js";
import { applyRules } from "./events/uwu.js";

export const events = {
    "uwu": {
        "post": (content, origin) => {
            let modifiedContent = content

            modifiedContent = applyRules(modifiedContent)

            if (origin) {
                bot.send({
                    "cmd": "direct",
                    "val": {
                        "cmd": "post_chat",
                        "val": {
                            "p": modifiedContent,
                            "chatid": origin
                        }
                    }
                });
            } else {
                bot.send({
                    "cmd": "direct",
                    "val": {
                        "cmd": "post_home",
                        "val": modifiedContent
                    }
                });
            }
        }
    }
}

export const activeEvents = ["uwu"]