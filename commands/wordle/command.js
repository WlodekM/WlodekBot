// import chalk from "chalk";
import fs from "fs";
import { bot } from "../../index.js"
const wordsJSON = fs.readFileSync("commands/wordle/words.json")

const games = {}

const wordlePrompt = {
  type: "text",
  name: "word",
  message: "Enter a 5 letter word...",
  validate: value => value.length != 5 ? 'The word must be 5 letters long' : wordsJSON.includes(value) ? true : 'Word not found'
};

export async function check(guess) {
  let results = [];
  // loop over each letter in the word
  for (let i in guess) {
    let attempt = { letter: guess[i], color: "bgGrey" };
    // check if the letter at the specified index in the guess word exactly
    // matches the letter at the specified index in the puzzle
    if (attempt.letter === puzzle[i]) {
      process.stdout.write(chalk.white.bgGreen.bold(` ${guess[i]} \t`));
      continue;
    }
    // check if the letter at the specified index in the guess word is at least
    // contained in the puzzle at some other position
    if (puzzle.includes(attempt.letter)) {
      process.stdout.write(chalk.white.bgYellow.bold(` ${guess[i]} \t`));
      continue;
    }
    // otherwise the letter doesn't exist at all in the puzzle
    process.stdout.write(chalk.white.bgGrey.bold(` ${guess[i]} \t`));
  }
  return results;
}


export function message({user, message, origin, command, args}) {
    function checkX(guess) {
      let result = ["",""];
      // loop over each letter in the word
      for (let i in guess) {
        let attempt = { letter: guess[i], color: "bgGrey" };
        // check if the letter at the specified index in the guess word exactly
        // matches the letter at the specified index in the puzzle
        if (attempt.letter === puzzle[i]) {
            result[0] += `**${guess[i]}**`
            result[1] += "🟩"
            continue;
        }
        // check if the letter at the specified index in the guess word is at least
        // contained in the puzzle at some other position
        if (puzzle.includes(attempt.letter)) {
            result[0] += `**${guess[i]}**`
            result[1] += "🟨"
            continue;
        }
        // otherwise the letter doesn't exist at all in the puzzle
        result[0] += `**${guess[i]}**`
        result[1] += "⬛"
      }
      return result;
    }
    
    function newGame(user) {
        let newGameID = user
        games[newGameID] = {}
        let randomNumber = Math.floor(Math.random(wordsJSON.length) * wordsJSON.length);
        games[newGameID]["word"] = wordsJSON[randomNumber].toUpperCase();
        games[newGameID]["tries"] = 0
        games[newGameID]["message"] = ""
        console.log(`Created game with id ${newGameID}`)
        bot.post(`Created game with id ${newGameID}`, origin)
        return newGameID
    }
    switch(command) {
        case "new":
            newGame(user)
            break;
        
        case "guess":
            if(!games[user]) {bot.post("You have to create a game first!", origin)}
            const response = prompts(wordlePrompt);
            games[user]["tries"] += 1;
            if(args.length < 1) {bot.post("You have to guess the word!", origin); return}
            if(args[0] == games[user]["word"]) {
                bot.post("You won!", origin);
                games[user] = null
                return;
            }
            games[user]["message"] += "\n" + checkX(args[0])
            if(games[user]["tries"] < 6) {bot.post(games[user]["message"], origin);return}
            console.log(`${games[user]["message"]}\nYou lost! The word was ${games[user]["word"]}.`)
            bot.post(`${games[user]["message"]}\nYou lost! The word was ${games[user]["word"]}.`, origin)
            break;
        default:
            bot.post(`Sub-command ${command} not found`, origin)

    }
}

// async function play(tries) {
//   // the user gets 5 tries to solve the puzzle not including the first guess
//   if (tries < 6) {
//     // ask the player for a guess word
//     const response = await prompts(wordlePrompt);
//     const guess = response.word.toUpperCase();
//     // if the word matches, they win!
//     if (guess == puzzle) {
//       console.log("WINNER!");
//     } else {
//       check(guess);
//       // this forces std out to print out the results for the last guess
//       process.stdout.write("\n");
//       // repeat the game and increment the number of tries
//       play(++tries);
//     }
//   } else {
//     console.log(`INCORRECT: The word was ${puzzle}`);
//   }
// }

// async function main() {
//   // get a random word
//   let randomNumber = Math.floor(Math.random(wordsJSON.length) * wordsJSON.length);
//   let puzzle = wordsJSON[randomNumber].toUpperCase();

//   // start the game
//   await play(0);
// }

// main();
