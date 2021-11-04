/**
 * File: utils.js
 * @author Theo Technicguy
 * @version 0.0.3
 *
 * This file includes general utility functions
 */

// Imports
const path = require("path");

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

    /**
     * Return current username based on the session cookie
     * @param req
     * @returns {{}|{user: {name}}}
     */
    getUserParam(req) {
        if (this.userIsLogged(req)) {
            return {"user": {"name": req.session.username}};
        } else {
            return {};
        }
    }

    /**
     * Check if users is logged in
     * @param req
     * @returns {boolean}
     */
    userIsLogged(req) {
        return req.session.username != null;
    }

    /**
     * Get uploaded file name
     * @param req
     * @returns {string|null}
     */
    getFileName(req) {
        if (req.file) {
            return path.basename(req.file["path"]);
        } else {
            return null;
        }
    }

}

module.exports = (new utils());