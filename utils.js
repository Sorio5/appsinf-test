/**
 * File: utils.js
 * @author Theo Technicguy
 * @version 0.0.1
 *
 * This file includes general utility functions
 */

// Imports
const crypto = require("crypto");

const config = require("./config/config");

class utils {
    hash(password) {
        return crypto.createHash("sha256").update(password).update(config.SALT).digest("hex");
    }
}

module.exports = (new utils());