/**
 * File: utils.js
 * @author Theo Technicguy
 * @version 0.0.2
 *
 * This file includes general utility functions
 */

// Imports
const crypto = require("crypto");

const config = require("./config/config");

class utils {

    /**
     * Return salted SHA-2 hash
     * @param password
     * @returns {string}
     */
    hash(password) {
        // Hash password with salt
        // We use SHA-2 as SHA-1 is getting phased out.
        return crypto.createHash("sha256").update(password).update(config.SALT).digest("hex");
    }
}

module.exports = (new utils());