/**
 * File: config/config.js
 * @author Theo Technicguy
 * @version 0.0.1
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
    log("Duplicating config file");
    let conf = JSON.parse(fs.readFileSync(DST, "utf-8"));
    let secret = crypto.randomBytes(32).toString("base64");
    log("Server generated secret is `"+secret+"`");
    conf.SECRET = secret;
    fs.writeFileSync(CFG, JSON.stringify(conf, null, 2), "utf-8");
    log("Wrote config file")
}

log("Exporting config");
module.exports = JSON.parse(fs.readFileSync(CFG, "utf-8"));