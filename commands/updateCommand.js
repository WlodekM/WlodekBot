// export default {
//   command: "update",
//   aliases: [],
//   func({ user, message, origin, command, args, bot }) {
//     exec("git stash\ngit pull", (error, stdout, stderr) => {
//       if (error) {
//         bot.post(`**Error (exec)**\n\`\`\`\n${error.message.replaceAll("`", "\\\`")}\n\`\`\``, origin);
//         return;
//       }
//       if (stderr) {
//         bot.post(`**Error (shell)**\n\`\`\`\n${stderr.replaceAll("`", "\\\`")}\n\`\`\``, origin);
//         return;
//       }
//       bot.post(`**Success**\n\`\`\`\n${stdout.replaceAll("`", "\\\`")}\n\`\`\``, origin);
//     });
//   }
// }

export function updateCommand({ user, message, origin, command, args, bot }) {
  exec("git stash\ngit pull", (error, stdout, stderr) => {
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