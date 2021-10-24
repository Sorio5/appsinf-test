/**
 * File: config/config.js
 * @author Theo Technicguy
 * @version 0.0.2
 *
 * This is the configuration interpreter.
 */

// Imports
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Config
const CFG = path.join(__dirname, "./config.json");
const DST = path.join(__dirname, "./config.dist.json");

// Log function
function log(msg) {
    console.log(path.basename(__filename) + ": " + msg)
}

if (!fs.existsSync(CFG)) {
    // Generate config if not found
    log("Duplicating config file");

    // Read default `.dist` config
    let conf = JSON.parse(fs.readFileSync(DST, "utf-8"));

    // Generate server secret and password salt
    let secret = crypto.randomBytes(32).toString("base64");
    let salt = crypto.randomBytes(32).toString("base64");
    log("Server generated secret is `" + secret + "`");
    log("Server generated salt is `" + salt + "`");

    // Set config values and export
    conf.SECRET = secret;
    conf.SALT = salt
    fs.writeFileSync(CFG, JSON.stringify(conf, null, 2), "utf-8");

    log("Wrote config file")
}

log("Exporting config");
module.exports = JSON.parse(fs.readFileSync(CFG, "utf-8"));