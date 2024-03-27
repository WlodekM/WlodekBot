import fs from 'fs'
import express from 'express'
import path from "path"
import { config, auth as configAuth, db, update, bot } from '../bot.js'
import JSONdb from "simple-json-db";
import os from "os"
import { log, getLogPath, logMessage } from "../libs/logs.js";
import { exec } from "child_process";
import strftime from '../libs/strftime.js'
import { v4 as uuidv4 } from "uuid";
import cookies from "cookie-parser"

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateUserId() {
    return uuidv4() // Replace with your user ID generation logic
}

console.log("Initializing HTMS...")
const s = {
    response: null,
    request: null,
    vars: {},
    api: {
        test: 'console.log("Hi")'
    },
    app: null,
    fs: fs,
    // JSONdb: JSONdb,
}
export function parseHtms(req, res, file = false, fileContent = null) {
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

    content = content.replaceAll("<include@sLib />", `<script>\n${strftime.toString()}\n</script>\n\n${lib}`)

    const regex = {
        include: /<include@([^>\s]+(?:\s[^>]+)*)\s*\/>/g,
        ss: /<ss>([\s\S]*?)<\/ss>/g,
        ss2: /<script type="module" context="ss">([\s\S]*?)<\/script>/g,
        api: /<api path="(.*?)">([\s\S]*?)<\/api>/g,
        api2: /<script path="(.*?)" context="api">([\s\S]*?)<\/script>/g,
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

    content = content.replace(regex.ss2, (match, group) => {
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

    // Finding all matches in the string
    const matches2 = content.matchAll(regex.api2);

    // Logging the extracted values
    for (const match of matches2) {
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

const sessions = {}

console.log("HTMS initialized!")

export const website = (() => {
    console.log("OI!")
    const app = express()
    app.use(cookies())
    s.app = app
    const port = 3000;
    app.set('trust proxy', true)
    app.use((req, res, next) => {
        if(req.path == "/api/web/login") return next()
        if(req.path.endsWith(".css")) return next()
        if(req.path.endsWith(".js")) return next()
        if(sessions[req.cookies?.session]) return next()
        
        let pp = publicPage("login.htms", "www/")
        
        // Access denied...
        res.status(401).send(parseHtms(req, res, pp[0])) // custom message
    })
    // old auth api
    // app.use((req, res, next) => {

    //     // -----------------------------------------------------------------------
    //     // authentication middleware

    //     const auth = { login: configAuth.web.u, password: configAuth.web.p }

    //     // parse login and password from headers
    //     const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    //     const [login, pass] = Buffer.from(b64auth, 'base64').toString().split(':')

    //     // Verify login and password are set and correct
    //     if (login && pass && login === auth.login && pass === auth.password) {
    //         // Access granted...
    //         return next()
    //     }

    //     log(`# User at ${req.ip} tried to access website (Entered credentials: ${login}, ${pass})`)

    //     // Access denied...
    //     res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    //     res.status(401).send('Authentication required.') // custom message

    //     // -----------------------------------------------------------------------

    // })
    //ANCHOR - API
    app.get('/api', (req, res) => {
        res.send('Hello World!, the api is in progress')
    })
    app.get('/api/web/login', (req, res) => {
        if(!req.query.username) return res.status(400).send("400 - Bad request (Missing \"username\" query option)")
        if(!req.query.password) return res.status(400).send("400 - Bad request (Missing \"password\" query option)")
        let userDB = new JSONdb("db/users.json")
        if (req.query.username == bot.username && req.query.password == configAuth.bot.password) {
            let sID = generateSessionId()
            res.cookie("session", sID)
            sessions[sID] = {
                username: req.query.username,
                password: req.query.password,
                type: 'overwrite'
            }
            console.log(sessions)
            return res.status(200).send("200")
        }
        if (!userDB.has(req.query.username)) return res.status(418).send("418 - I'm a teapot (Username not found)")
        if (userDB.get(req.query.username).password != req.query.password) return res.status(418).send("418 - I'm a teapot (Invalid password)")
        let sID = generateSessionId()
        res.cookie("session", sID)
        sessions[sID] = {
            username: req.query.username,
            password: req.query.password,
            type: 'webAdmin'
        }
        console.log(sessions)
        return res.status(200).send("200")
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
        logMessage(`${bot.username}: ${req.query["post"]}`)
        bot.post(`${req.query["post"]}`)
        res.send(`<span style="color: limegreen">Success</span>`)
    });
    app.get('/api/htmx/shell', (req, res) => {
        if (!req.query["cmd"]) { return res.send(`<span style="color: red">No "cmd" argument</span>`); }
        console.log(req.query.cmd)
        exec(req.query["cmd"], (error, stdout, stderr) => {
            if (error) {
                return res.send(`Error (exec)\n${error.message.replaceAll("\n", "<br>").replaceAll(" ", "&nbsp;")}`);
            }
            if (stderr) {
                return res.send(`Error (shell)\n${stderr.replaceAll("\n", "<br>").replaceAll(" ", "&nbsp;")}`);
            }
            return res.send(`Success<br>${stdout.replaceAll("\n", "<br>").replaceAll(" ", "&nbsp;")}`);
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
        let logs = deHTML(fs.readFileSync(getLogPath("message")));
        // console.log(getLogPath("message"))
        logs = logs.split("\n").slice(-50);

        logs.forEach((a, i) => {
            // if (a.startsWith("! E:")) {
            //     logs[i] = `<sl-badge variant="danger" pill>ERR</sl-badge> <span style="color: #e00">${a.replaceAll("\n", "<br>")}</span></div>`
            //     return
            // }
            // if (a.startsWith(": ")) {
            //     logs[i] = `<sl-badge variant="primary" pill>INFO</sl-badge> <span style="color: blue">${a.replaceAll("\n", "<br>")}</span></div>`
            //     return
            // }
            // if (a.startsWith("! ")) {
            //     logs[i] = ""
            //     return
            // }
            logs[i] = logs[i] + "<br>"
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
    // Define a route to handle browsing the file system
    app.get('/browse', (req, res) => {
        let splitPath = req.query.path
        const basePath = splitPath || './'; // Get the path from query parameter, default to current directory
        if(!fs.existsSync(basePath)) return res.send("404")
        if(fs.statSync(basePath).isDirectory() && !fs.existsSync(basePath)) res.send("file not found")
        if(!fs.statSync(basePath).isDirectory()) return res.send(fs.readFileSync(basePath))
        const files = fs.readdirSync(basePath)
            .map(file => {
                const fullPath = path.join(basePath, file);
                const stats = fs.statSync(fullPath);
                return {
                    name: file,
                    isDirectory: stats.isDirectory(),
                    fullPath: fullPath,
                    stats: stats
                };
            });

        res.json(files);
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
        s.request = req;
        let splitPath = new URL(`https://${req.headers.host}${req.path}`).pathname.split("/")
        let splitURL = req.url.split(".")
        if (s.api[splitPath[splitPath.length - 1]]) {
            return res.send(String(eval(s.api[splitPath[splitPath.length - 1]])))
        }
        let pp = publicPage(req.path, req.url.startsWith("/") ? "www/public" : "www/public/")

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