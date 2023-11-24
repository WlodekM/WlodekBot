import http from "https"

export function joke({user, message, origin, command, args}) {
  var result = '';
  const req = http.request(`https://official-joke-api.appspot.com/random_joke`, (res) => {
    // console.log(res.statusCode);

    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      result += chunk;
    });
    res.on('end', () => {
      result = JSON.parse(result)
      bot.post(`${result.setup}\n${result.punchline}`, origin)
    });
  });
}