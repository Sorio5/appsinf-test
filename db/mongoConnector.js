/**
 * File: db/mongoConnector.js
 * @author Theo Technicguy
 * @version 0.0.2
 *
 * This module manages database connections.
 * Inspired by the CodeWe Project's MongoDB module - MIT License
 * https://github.com/CodeWe-projet/CodeWe
 */

// Requires
const MongoClient = require("mongodb").MongoClient;

const config = require("../config/config");

// Config
const DB_URL = config.DB_URL;

class MongoConnector {
    constructor(url) {
        // Create MongoConnector client for a url with options
        this.client = new MongoClient(url, {
            "useNewUrlParser": true,
            "useUnifiedTopology": true
        });
    }

    /**
     * Connect to database and set class variables
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     */
    async connect() {
        try {
            // Connect to database
            this.db = await this.client.connect();
            // Get FMP database
            this.fmp = await this.db.db("FixMyPath");
            // Set collection variables
            this.users = this.fmp.collection("users");
            this.incidents = this.fmp.constructor("incidents");

            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    // ---------- Database GET/FIND methods ----------
    /**
     * Get a user given a username
     * @param username
     * @returns {Promise<*>}
     */
    async getUser(username) {
        try {
            return await this.users.findOne({username: username});
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }
    /**
     * Get an incident given an incident ID
     * @param id
     * @returns {Promise<*>}
     */
    async getIncident(id) {
        try {
            return await this.incidents.findOne({id: id});
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    // ---------- Database POST/INSERT methods ----------
    /**
     * Create a new user with a unique username
     * @param data: dictionary {
     *     username: unique,
     *     display_name,
     *     email,
     *     password: salted SHA-2 string
     * }
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     * @output new user in database
     */
    async createUser(data) {
        // Make sure to have everything, and only what we need
        let document = {
            "username": data.username,
            "display_name": data.display_name,
            "email": data.email,
            "password": data.password,
            "creation_date": Date.now(),
            "last_visit": Date.now()
        };

        // Insert User
        try {
            await this.users.insertOne(document);
            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    /**
     * Create a new incident
     * @param data: dictionary {
     *      TBD
     * }
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     * @output new incident in database
     */
    async createIncident(data) {
        let document = {
            // TODO: Define structure
        };

        // Insert incident
        try {
            await this.users.insertOne(document);
            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    // ----------- Database PUT/UPDATE methods ----------
    /**
     * Update a user's parameter given a username
     * @param username
     * @param param
     * @param newValue
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     * @output Database entry for user updated
     */
    async updateUser(username, param, newValue) {
        try {
            const update = {param: newValue};
            await this.users.updateOne({username: username}, {$set: update});
            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    /**
     * Update an incident's parameter given an ID
     * @param id
     * @param param
     * @param newValue
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     * @output Database entry for user updated
     */
    async updateIncident(id, param, newValue) {
        try {
            const update = {param: newValue};
            // WARNING: Check for id vvv !!!
            await this.incidents.updateOne({id: id}, {$set: update});
            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    // Quick updates
    /**
     * Update a user's last visit timestamp
     * @param username
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     */
    async updateLastVisit(username) {
        return await this.updateUser(username, "last_visit", Date.now());
    }
}

/**
 * Initialize database connection
 * @input Database URL from config
 * @returns {MongoConnector}
 */
function getDB() {
    let db = new MongoConnector(DB_URL);
    db.connect();
    return db;
}

module.exports = getDB();