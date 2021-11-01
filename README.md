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
This will run the server with default configuration. If you want to change settings, duplicate `config.dist.json` to `config.json` or edit the last one directly.

## Credits
Thanks to
- Every node package author - check each package for respective licensing
- the [CodeWe Project](https://github.com/CodeWe-projet/CodeWe) for their MongoDB connector file - MIT License
- [Bulma](https://bulma.io) for their Cascading Style Sheets - MIT License
- [Gregor Cresnar Premium](https://www.flaticon.com/authors/gregor-cresnar-premium) and [Freepik](https://www.freepik.com) for their logo assets - Flaticon Terms of Use