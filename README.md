# WlodekBot
A fork of wlbot with more features and easier customisability.

## Setting up the bot

### Installing dependencies
``npm install``

### Configuring the bot
In the folder where you downloded this repo should be two config files "`config.cfg`" and "`config-auth.cfg`".

The `config.cfg` file contains basic settings like the ID for the GC where the bot will dump suggestions.

The `config-auth.cfg` file contains private info like the username and password for logging in.

> Structure of `config-auth.cfg`:
> 
> ```
> {
>   "bot": {
>     "username": "...",
>     "password": "..."
>   }
> }
> ```

## Running the bot
To run the bot, you have to have node.js installed and run this command using your terminal
```
node .
```
