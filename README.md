# FixMyPath
FixMyPath is a project based on [FixMyStreet](https://fixmystreet.brussels), an incident reporting system for Brussels. The project has been created in the context of Computer Science studies at [UCLouvain](https://uclouvain.be) University, Belgium, aiming to transpose the idea to Louvain-la-Neuve.

## Installing
To install or use this project you will need following dependencies:
- [Git](https://git-scm.com)
- [MongoDB](https://mongodb.com) - community edition available for free [here](https://www.mongodb.com/try/download/community)
- [NodeJS](https://nodejs.org) and this package manager.

Start by cloning this repository and install npm dependencies.
```shell
git clone https://github.com/Sorio5/appsinf-test.git
npm install
```

## Running FixMyPath
To run the website, first make sure you have an active instance of the Mongo server, then execute the following command in a shell.
```shell
node ./server.js
```
This will run the server with default configuration. If you want to change settings, duplicate `config.dist.json` to `config.json` or edit the last one directly (see `./config/config.md` for details).

## SSL/TLS and HTTPS
The server defaults to `HTTP` when required TLS configuration is missing, but will try to run `HTTPS` if it can.
To generate a self-signed certificate (easiest), run

```shell
mkdir tls
openssl req -x509 -newkey rsa:4096 -keyout ./tls/key.pem -out ./tls/cert.pem -days 365
```

This will generate a self-sign certificate and store everything in the `./tls` directory. Now change `./config/config.json`'s TLS section to include those files (the `key.pem` is the `KEY` and the `cert.pem` is the `CRT`). Restart the server and you should be running `HTTPS`.

> Note: As this is a self-signed certificate, most browsers will raise a warning. You can ignore that - you trust yourself, no?

## Credits
Thanks to
- Every node package author - check each package for respective licensing
- the [CodeWe Project](https://github.com/CodeWe-projet/CodeWe) for their MongoDB connector file - MIT License
- [Bulma](https://bulma.io) for their Cascading Style Sheets - MIT License
- [Gregor Cresnar Premium](https://www.flaticon.com/authors/gregor-cresnar-premium) and [Freepik](https://www.freepik.com) for their logo assets - Flaticon Terms of Use
