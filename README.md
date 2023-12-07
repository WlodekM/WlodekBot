# WlodekBot

A fork of wlbot with more features and easier customizability.

## Setting up the bot

### Installing dependencies

``npm install``

### Configuring the bot

In the repo's folder there should be two config files "`config.cfg`" and "`config-auth.cfg`".

The `config.cfg` file contains basic settings like the currency, server and api urls, etc..

The `config-auth.cfg` file contains private info like the username and password for logging in.

> Structure of `config-auth.cfg`:
>
> ```json
> {
>   "bot": {
>     "username": "...",
>     "password": "..."
>   }
> }
> ```

## Running the bot

To run the bot, you have to have node.js installed and run this command using your terminal

```shell
node .
```
