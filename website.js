import fs from 'fs'
import express from 'express'
import { config, configAuth, db, update, bot } from './index.js'
import { log } from "./libs/logs.js";
import { exec } from "child_process";

console.log("Initializing HTMS...")
const s = {
    response: null,
    request: null,
    vars: {},
    api: {
        test: 'console.log("Hi")'
    },
    app: null,
    fs:  fs,
    // JSONdb: JSONdb,
}
export function parseHtms(req, res, file=false, fileContent=null) {
    let template
    if (file) template = fs.readFileSync(String(file))
    const dictionary = {
        "DATE": (() => {
            return new Date()
        }),
        "PATH": (() => {
            return req.path
        }),
        "URL": () => {
            return req.url
        }
    }
    let content = file ? String(template) : String(fileContent)

    let lib = fs.readFileSync("www/standardLib.htms")

    content = content.replaceAll("<include@sLib />", lib)

    const regex = {
        include: /<include@([^>\s]+(?:\s[^>]+)*)\s*\/>/g,
        ss: /<ss>([\s\S]*?)<\/ss>/g,
        api: /<api path="(.*?)">([\s\S]*?)<\/api>/g,
        apiHelper: /<\#([\s\S]*?)>/g
    }

    content = content.replace(regex.include, (match, group) => {
        try {
            // Evaluate the code inside <!--include@--> tags
            const result = fs.readFileSync(group);
            return `<!-- HTMLS - Included code from ${group} -->\n${parseHtms(req, res, null, result)}\n<!-- HTMLS - End included code -->`;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error including code: ${group}\nError: `, error);
            return match + `<script>console.error("Could not include ${group}", "${String(error).replaceAll("\n", "\\n")}")</script>\n<!--Inclusion error-->\n<!--${error}-->`;
        }
    });

    // content = content.replaceAll("{[CONTENT]}", response)
    for (const key in dictionary) {
        if (!Object.hasOwnProperty.call(dictionary, key)) continue;
        const element = dictionary[key];
        content = content.replaceAll(`<@${key}>`, element())
    }

    // console.log(content)

    content = content.replace(regex.ss, (match, group) => {
        try {
            // Evaluate the code inside <!--$...$--> tags
            const result = eval(group);
            const sanitizedResult = result !== undefined ? String(result) : '';
            return sanitizedResult;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error evaluating code: ${group}\nError: `, error);
            return match;
        }
    });

    // Finding all matches in the string
    const matches = content.matchAll(regex.api);

    // Logging the extracted values
    for (const match of matches) {
        const APIpath = match[1];
        const code = match[2];
        console.log(APIpath)
        s.api[`${req.path.replace("/", "")}-${APIpath}`] = code
        content = content.replace(match[0], `<!-- API endpoint definition here (${req.path.replace("/", "")}-${APIpath}) -->\n<!--\n${code}\n-->`);
    }

    content = content.replace(regex.apiHelper, (match, group) => {
        try {
            // Evaluate the code inside <%--...--%> tags
            const result = `${req.path.replace("/", "")}-${group}`;
            const sanitizedResult = result !== undefined ? String(result) : '';
            return sanitizedResult;
        } catch (error) {
            // If there's an error during evaluation, return the original match
            console.error(`Error evaluating code: ${group}\nError: `, error);
            return match;
        }
    });

    //     try {
    //         // Evaluate the code inside %{...} brackets
    //         console.log(code, match)
    //         const result = eval(code);
    //         return result !== undefined ? result : match;
    //     } catch (error) {
    //         // If there's an error during evaluation, return the original match
    //         console.error(`Error evaluating code: ${code}`);
    //         return match;
    //     }
    // });
    return content
}

const mimeTypes = {
    "htms": "text/html",
    "htmlx": "text/html",
    "html": "text/html",
    "css": "text/css",
    "xcss": "text/css",
    "png": "image/png",
    "mp4": "video/mp4"
}

function publicPage(RequestURL, FilePath) {
    // console.log(RequestURL)
    let path = RequestURL
    let filePath = (`${FilePath}${path}`)
    // console.log(filePath)
    let isDir = !(filePath.indexOf('.') > -1)
    if (isDir) filePath += filePath.endsWith("/") ? "index.html" : "/index.html"
    // console.log(filePath, isDir)
    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(filePath.replaceAll(".html", ".htms"))) {
            return [filePath.replaceAll(".html", ".htms"), "htms"]
        }
        if (fs.existsSync(filePath.replaceAll(".html", ".xhtml"))) {
            return [filePath.replaceAll(".html", ".xhtml"), "xhtml"]
        }
        if (fs.existsSync(filePath.replaceAll(".html", ".ss"))) {
            console.log(filePath.replaceAll(".html", ".ss"))
            return [filePath.replaceAll(".html", ".ss"), "ss"]
        }
        return []
    } else {
        const types = ["ss", "xhtml", "htms"]
        let splitPath = filePath.split(".")
        let type = splitPath[splitPath.length - 1]
        // console.log(`AA ${type}`)
        switch (type) {
            case "xhtml":
                return [filePath, "xhtml"]
                break;
            case "htms":
                return [filePath, "htms"]
                break;
            case "ss":
                return [filePath, "ss"]
                break;

            default:
                return [filePath, "plaintext"]
                break;
        }
    }
    // console.log(filePath)
    return [filePath]
}
function publicPageFile(FilePath) {
    // console.log(RequestURL)
    // let path = RequestURL
    let filePath = (`${FilePath}`)
    // console.log(filePath)
    let isDir = !(filePath.indexOf('.') > -1)
    if (isDir) filePath += filePath.endsWith("/") ? "index.html" : "/index.html"
    // console.log(filePath, isDir)
    if (!fs.existsSync(filePath)) {
        if (fs.existsSync(filePath.replaceAll(".html", ".htms"))) {
            return [filePath.replaceAll(".html", ".htms")]
        }
        if (fs.existsSync(filePath.replaceAll(".html", ".xhtml"))) {
            return [filePath.replaceAll(".html", ".xhtml"), true]
        }
        return []
    }
    return [filePath]
}
function leaderboard(userscores) {
    let result = Object.entries(userscores)
        .sort((a, b) => b[1] - a[1])
        .map((p, index) => `${index + 1}: ${p[0]} - ${p[1]}`)
        .join("\n");
    return (result)
}
function formatshop(userscores) {
    let result = Object.entries(userscores)
        .sort((a, b) => b[1] - a[1])
        .map((p) => `${p[0]} - ${p[1]}${config.settings.economy.currency}`)
        .join("\n");
    return (result)
}
function leaderboardArray(userscores) {
    let result = Object.entries(userscores)
        .sort((a, b) => b[1] - a[1])
        .map((p, index) => `${p[0]} - ${p[1]}`)
    return (result)
}
function leaderboardarrayplace(userscores) {
    let result = Object.entries(userscores)
        .sort((a, b) => b[1] - a[1])
        .map((p, index) => p[0])
    return (result)
}
function handle404(req, res) {
    let ihdguk = publicPageFile("htms/404.htms")
    // console.log(ihdguk)
    res.status(404).send(parseHtms(req, res, ihdguk[0]))
}

console.log("HTMS initialized!")

export const website = (() => {
    console.log("OI!")
    const app = express()
    s.app = app
    const port = 3000;
    app.set('trust proxy', true)
    app.use((req, res, next) => {

        // -----------------------------------------------------------------------
        // authentication middleware

        const auth = { login: configAuth.web.u, password: configAuth.web.p }

        // parse login and password from headers
        const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
        const [login, pass] = Buffer.from(b64auth, 'base64').toString().split(':')

        // Verify login and password are set and correct
        if (login && pass && login === auth.login && pass === auth.password) {
            // Access granted...
            return next()
        }

        log(`# User at ${req.ip} tried to access website (Entered credentials: ${login}, ${pass})`)

        // Access denied...
        res.set('WWW-Authenticate', 'Basic realm="401"') // change this
        res.status(401).send('Authentication required.') // custom message

        // -----------------------------------------------------------------------

    })
    //ANCHOR - API
    app.get('/api', (req, res) => {
        res.send('Hello World!, the api is in progress')
    })
    //json
    app.get('/api/json/shutdown', (req, res) => {
        res.send('200')
        process.exit(1)
    })
    app.get('/api/json/postHome', (req, res) => {
        if (req.query["post"] == null) { res.send(`{"error":true,"type":"E:101 | Invalid arguments"}`); return }
        bot.post(`${req.query["post"]}`)
        res.send(`{"error":false"}`)
    });
    // htmx
    app.get('/api/htmx/shutdown', (req, res) => {
        res.send('<span style="color: limegreen">Success</span>')
        process.exit(1)
    })
    app.get('/api/htmx/postHome', (req, res) => {
        if (req.query["post"] == null) { res.send(`<span style="color: red">No "post" argument</span>`); return }
        bot.post(`${req.query["post"]}`)
        res.send(`<span style="color: limegreen">Success</span>`)
    });
    app.get('/api/htmx/shell', (req, res) => {
        if (!req.query["cmd"]) { return res.send(`<span style="color: red">No "cmd" argument</span>`);  }
        exec(req.query["cmd"], (error, stdout, stderr) => {
            if (error) {
                return res.send(`**Error (exec)**\n\`\`\`\n${error.message.replaceAll("\n", "<br>")}\n\`\`\``);
            }
            if (stderr) {
                return res.send(`**Error (shell)**\n\`\`\`\n${stderr.replaceAll("\n", "<br>")}\n\`\`\``);
            }
            return res.send(`**Success**<br>${stdout.replaceAll("\n", "<br>")}`);
        });
    });
    app.get('/api/htmx/logs', (req, res) => {
        function deHTML(input) {
            let dhout = String(input);
            dhout = dhout.replaceAll("&", "&amp;");
            dhout = dhout.replaceAll("<", "&lt;");
            dhout = dhout.replaceAll(">", "&gt;");
            dhout = dhout.replaceAll('"', "&quot;");
            dhout = dhout.replaceAll("'", "&apos;");
            return dhout;
        }
        let logs = deHTML(fs.readFileSync('logs.txt'));
        logs = logs.split("\n").slice(-50);

        logs.forEach((a, i) => {
            if (a.startsWith("! E:")) {
                logs[i] = `<sl-badge variant="danger" pill>ERR</sl-badge> <span style="color: #e00">${a.replaceAll("\n", "<br>")}</span></div>`
                return
            }
            if (a.startsWith(": ")) {
                logs[i] = `<sl-badge variant="primary" pill>INFO</sl-badge> <span style="color: blue">${a.replaceAll("\n", "<br>")}</span></div>`
                return
            }
            if (a.startsWith("! ")) {
                logs[i] = ""
                return
            }
            logs[i] = logs[i]?.replaceAll("\n", "<br>") + "<br>"
        })

        res.send(logs.join("\n"))
    });


    app.get('/config', function (req, res) {
        fs.readFile('config.cfg', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let respond = data
            respond = respond.split("\n").slice(-50).join("\n");
            respond = `\
        <head>\
        <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
        </head>
        <body>\
          <textarea rows="${respond.split("\n").length}" cols="200">
  ${respond}
          </textarea>
        <div id="end"></div></body>`
            res.send(respond)
        });
    });
    app.get('/logs', function (req, res) {
        function deHTML(input) {
            let dhout = input;
            dhout = dhout.replaceAll("&", "&amp;");
            dhout = dhout.replaceAll("<", "&lt;");
            dhout = dhout.replaceAll(">", "&gt;");
            dhout = dhout.replaceAll('"', "&quot;");
            dhout = dhout.replaceAll("'", "&apos;");
            return dhout;
        }
        fs.readFile('logs.txt', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let respond = data
            respond = respond.split("\n").slice(-50).join("\n");
            respond = `\
        <head>\
        <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
        </head><body>\
        ${deHTML(respond).replaceAll("\n", "<br>")}<div id="end"></div></body>`
            res.send(respond)
        });
    });
    app.get('/config', function (req, res) {
        function deHTML(input) {
            let dhout = input;
            dhout = dhout.replaceAll("&", "&amp;");
            dhout = dhout.replaceAll("<", "&lt;");
            dhout = dhout.replaceAll(">", "&gt;");
            dhout = dhout.replaceAll('"', "&quot;");
            dhout = dhout.replaceAll("'", "&apos;");
            return dhout;
        }
        fs.readFile('config.cfg', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            let respond = data
            respond = `\
        <head>\
        <link rel="stylesheet" href="../logs.css"><meta name="color-scheme" content="light dark">\
        </head><body>\
        ${deHTML(respond).replaceAll("\n", "<br>")}<div id="end"></div></body>`
            res.send(respond)
        });
    })
    app.get('/messages', function (req, res) {
        res.send(welcome_messages.get("verified").join("<br>"))
    });
    app.get("*", (req, res) => {
        //code from the HTMS project (currently not public)
        s.response = res;
        s.request  = req;
        let splitPath = req.path.split("/")
        let splitURL = req.url.split(".")
        if (s.api[splitPath[splitPath.length - 1]]) {
            return res.send(String(eval(s.api[splitPath[splitPath.length - 1]])))
        }
        let pp = publicPage(req.url, req.url.startsWith("/") ? "htms" : "htms/")

        switch (pp[1]) {
            case "plaintext":
                let plaintext = fs.readFileSync(String(pp[0]))
                let splitURL = req.url.split(".")
                if (mimeTypes[splitURL[splitURL.length - 1]]) {
                    res.setHeader("Content-Type", mimeTypes[splitURL[splitURL.length - 1]])
                }
                res.send(plaintext)
                break;
            case "htms":
                res.send(
                    parseHtms(req, res, pp[0])
                )
                break;
            case "ss":
                let code = (fs.readFileSync(pp[0])).toString()
                res.send(
                    eval(code)
                )
                break;

            default:
                handle404(req, res)
                break;
        }
    })
    // app.get('/', function (req, res) {
    //     fs.readFile('ulist.txt', 'utf8', (err, data) => {
    //         if (err) {
    //             console.error(err);
    //             return;
    //         }
    //         var userlist = JSON.parse(data)
    //         var database_a = db.JSON()
    //         var money_leaderboard = {}
    //         for (const key in database_a) {
    //             if (Object.hasOwnProperty.call(database_a, key)) {
    //                 const element = database_a[key];
    //                 if (key.includes("-money")) {
    //                     let keya = key.replaceAll("-money", "")
    //                     money_leaderboard[keya] = element
    //                 }
    //             }
    //         }
    //         fs.readFile('public/index_a.htm', 'utf8', (err, data1) => {
    //             var data2 = data1.replaceAll("[ULIST]", `<li>${userlist.join("</li>\n<li>")}</li>`)
    //             data2 = data2.replaceAll("[LB]", `<ol><li>${leaderboardArray(money_leaderboard).join("</li>\n<li>")}</li></ol>`)
    //             data2 = data2.replaceAll("[UPDATE]", `\
    //       <h5 id="padding1">${update.version}</h5>\
    //       <p id="paddingleft1">${update.changelog.replaceAll("\n", "<br>")}</p>`)
    //             res.send(data2);
    //         });
    //     });
    // });
    app.get('/userlist', function (req, res) {
        fs.readFile('ulist', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            var userlist = JSON.parse(data)
            var result = `<li>${userlist.join("</li>\n<li>")}</li>`
            res.send(result);
        });
    });
    // app.use(express.static('public'));
    app.listen(port, () => {
        console.log(`The WIP web-console is up on port ${port}`)
        // open("http://localhost:3000/", config.settings.browser);
    });
})