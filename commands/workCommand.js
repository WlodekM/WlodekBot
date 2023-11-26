import {bot, db, config} from "../index.js"

export function workCommand({user, message, origin, command, args}) {
    db.sync();
    if (!db.has(`${user}-money`)) db.set(`${user}-money`, 0);
    if (!db.has(`${user}-work-cooldown`)) db.set(`${user}-work-cooldown`, 0);
    const cooldown = db.get(`${user}-work-cooldown`);
    if (cooldown <= getunix()) {
        const moneyEarned = getRandomInt(16, 32);
        const userMoney = db.get(`${user}-money`);
        db.set(`${user}-money`, userMoney + moneyEarned);
        db.set(`${user}-work-cooldown`, getunix() + Number(config.settings.economy.workCooldown));
        bot.post(`You have earned ${moneyEarned}${config.settings.economy.currency}`, origin);
    } else {
        const cooldownLeft = cooldown - getunix();
        bot.post(`You need to wait ${cooldownLeft} more second${cooldownLeft == 1 ? "" : "s"}`, origin);
    }

    db.sync();
}