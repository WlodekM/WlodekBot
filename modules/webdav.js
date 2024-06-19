// TypeScript/ESM
import { v2 as webdav } from 'webdav-server'
import express from 'express'
import * as logs from "../libs/logs.js";

export default {
    run: function(config, auth) {
        logs.log("Ran WebDAV module")
        const userManager = new webdav.SimpleUserManager();
        const user = userManager.addUser(auth.bot.user.username, auth.bot.password, false);
         
        // Privilege manager (tells which users can access which files/folders)
        const privilegeManager = new webdav.SimplePathPrivilegeManager();
        privilegeManager.setRights(user, '/webDAV/', [ 'all' ]);
         
        const server = new webdav.WebDAVServer({
            // HTTP Digest authentication with the realm 'Default realm'
            httpAuthentication: new webdav.HTTPDigestAuthentication(userManager, 'Default realm'),
            privilegeManager: privilegeManager,
            autoSave: { // Will automatically save the changes in the 'data.json' file
                treeFilePath: 'data.json'
            }
        });
        server.afterRequest((arg, next) => {
            // Display the method, the URI, the returned status code and the returned message
            console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage);
            // If available, display the body of the response
            console.log(arg.responseBody);
            next();
        });
        const app = express();

        app.use(webdav.extensions.express('/webDAV/', server));
        app.listen(6920, ()=>{
            console.log("WebDAV server listening at port 6920")
        }); // Start the Express server
    }
}