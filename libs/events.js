import { bot } from "../index.js";
import { applyRules } from "./uwu.js";

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