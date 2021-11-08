/**
 * File: db/mongoConnector.js
 * @author Theo Technicguy, Sorio
 * @version 1.0.3
 *
 * This module manages database connections.
 * Inspired by the CodeWe Project's MongoDB module - MIT License
 * https://github.com/CodeWe-projet/CodeWe
 */

// Requires
const {MongoClient, ObjectId} = require("mongodb");

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
            this.incidents = this.fmp.collection("incidents");
            //adding an admin user
            try{
                this.users.deleteOne({"username":"admin"});
            }catch(err){}
            var utils = require('./../utils')
            let document = {
                "username": "admin",
                "display_name":"admin",
                "email": "admin@mail.com",
                "password": utils.hash("admin"),
                "creation_date": Date.now(),
                "last_visit": Date.now()
            };
            this.users.insertOne(document);

            try {
                this.incidents.createIndex({description: "text", address: "text", author: "text"}, {weights: { description: 5, address: 2}});
            } catch (err) {}

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
     * Get a username's display name
     * @param username
     * @returns {Promise<*>}
     */
    async getDisplayName(username) {
        try {
            const user = await this.getUser(username);
            return user.display_name;
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
            return await this.incidents.findOne({"_id": ObjectId(id)});
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    /**
     * Get all incidents from a start up to a limit
     * @param limit
     * @param start
     * @returns {Promise<*|{code: number, message: string, error: Error}>}
     */
    async getAllIncidents(limit = 50, start = 0) {
        try {
            return await this.incidents.find({}).sort({creation_date: -1}).skip(start).limit(limit).toArray();
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
    }

    async searchIncidents(search, limit = 50, start = 0) {
        try {
            return await this.incidents.find({$text: {$search: search}}).sort({creation_date: -1}).skip(start).limit(limit).toArray();
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
     *     description,
     *     address,
     *     author: username from table `users`,
     *     status: One of `Recorded`, `Work in Progress` or `Done`
     * }
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     * @output new incident in database
     */
    async createIncident(data) {
        let document = {
            "description": data.description,
            "address": data.address,
            "author": data.author,
            "image": data.image,
            "status": "Recorded",
            "creation_date": Date.now(),
            "last_update": Date.now()
        };

        // Insert incident
        try {
            await this.incidents.insertOne(document);
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
            let update = {};
            update[param] = newValue;
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
     * @output Database entry for incident updated
     */
    async updateIncident(id, param, newValue) {
        try {
            let update = {};
            update[param] = newValue;
            await this.incidents.updateOne({"_id": ObjectId(id)}, {$set: update});
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

    /**
     * Update the last update visit of an incident
     * @param id
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error}>}
     *      code: 200, message: "Success"
     *      code: 500, message: "Error", error: error
     */
    async updateLastUpdate(id) {
        return await this.updateIncident(id, "last_update", Date.now());
    }

    // ----------- Database DELETE/DELETE methods ----------
    /**
     * Delete an incident
     * @param id
     * @returns {Promise<{code: number, message: string}|{code: number, message: string, error: Error}>}
     */
    async deleteIncident(id) {
        try {
            await this.incidents.deleteOne({"_id": ObjectId(id)});
            return {"code": 200, "message": "Success"};
        } catch (err) {
            return {"code": 500, "message": "Error", "error": new Error(err)};
        }
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