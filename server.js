/**
 * File: server.js
 * @author Theo Technicguy, Sorio
 * @version 0.1.6
 */

// Imports and modules
const path = require("path");
const express = require("express");
const consolidate = require("consolidate");
const mongo = require("mongodb").MongoClient;
const https = require('https');
const fs = require('fs');
const session = require('express-session');
const req = require("express/lib/request");

const crypto = require("crypto");

const config = require("./config/config");
const db = require("./db/mongoConnector");

// --- Config ---
const HOST = config.HOST;
const PORT = config.PORT;
const SECRET = config.SECRET;
const SALT = config.SALT;

// --- Setup server ---
const app = express();
// Set rendering engine and views
app.engine("html", consolidate.hogan);
app.set("views", "views");
// Set public assets folder
app.use(express.static(path.join(__dirname, 'public/')));
// By default, express sets an `X-Powered-By` header tag. Disable this
app.disable("x-powered-by");

app.use(express.urlencoded({extended: true}));

// Set express Sessions cookies
app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        maxAge: 3600000
    }
}));

app.get(["/", "/index", "/index.html"], (req, res) => {
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.session.username == null) {
        user_param = {}
    } else {
        user_param = {"user": {"name": req.session.username}};
    }
    mongo.connect(config.DB_URL, (err, client) => {
        if (err) throw err;
        var dbo = client.db("users");
        dbo.collection("incidents").find({}).toArray((err, result) => {
            if (err) throw err;
            res.render("index.html", {result, user_param});
            client.close();
        });
    });
});

/**
 * Login confirmation page
 * @method post
 * @path /login
 */
app.post("/login", async (req, res) => {
    // Filter out incomplete responses
    if (!req.body.username || !req.body.password) {
        // TODO: Send error feedback.
        res.redirect("/login");

        // Break out of function
        return;
    }

    // Ease username access
    const username = req.body.username;
    // Get username from database
    const user = (await db.getUser(username));
    // Check if username exists
    if (!user) {
        res.redirect("/login");
        return;
    }

    // Hash password with salt
    // We use SHA-2 as SHA-1 is getting phased out.
    let password = crypto.createHash("sha256").update(req.body.password).update(SALT).digest("hex");

    if (password === user.password) {
        // Now the user is authenticated.
        // Prefer user.username over req.body.username, even if they are equal, as the first one is our data
        // Update last login time
        await db.updateLastVisit(user.username);

        // Set session cookie
        req.session.username = user.username;
        // Redirect.
        res.redirect("/report");
    } else {
        // TODO: Send error feedback.
        res.redirect("/login");
    }
});

/**
 * Enrollment registration page
 * @method post
 * @path /register
 */
app.post("/register", async (req, res) => {
    const body = req.body;

    // Check if all fields are filled
    if (!body.username || !body.display_name || !body.email || !body.password || !body.password2) {
        // TODO: Send error feedback
        res.redirect("/login");
        return;
    }

    // Check if user already exists
    // Usernames have to be unique.
    if (await db.getUser(body.username)) {
        // TODO: Send error feedback
        res.redirect("/login");
        return;
    }

    // Validate email
    const emailRE = /[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
    if (!emailRE.test(body.email)) {
        // TODO: Send error feedback
        res.redirect("/login");
        return;
    }

    // Check that passwords are equal
    if (body.password !== body.password2) {
        // TODO: Send error feedback
        res.redirect("/login");
        return;
    }

    // Create data structure to transmit
    const data = {
        "username": body.username,
        "display_name": body.display_name,
        "email": body.email,
        "password": crypto.createHash("sha256").update(body.password).update(SALT).digest("hex")
    };

    await db.createUser(data);

    res.redirect("/login");
});

app.get("/login", (req, res) => {
    res.render("login.html");
});

app.get(["/report", "/new_incident"], (req, res) => {
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.session.username == null) {
        user_param = {}
    } else {
        user_param = {"user": {"name": req.session.username}};
    }

    res.render("new_incident.html", user_param);
});

app.post("/insert", (req, res) => {
    if (req.session.username == null) {
        res.redirect('/login')
    } else {
        let user_param = req.session.username;
        var item = {
            description: req.body.description,
            adresse: req.body.adresse,
            date: new Date().toLocaleDateString(),
            author: user_param
        };

        mongo.connect(config.DB_URL, (err, client) => {
            if (err) throw err;
            var dbo = client.db("users");
            dbo.collection("incidents").insertOne(item, function (err) {
                if (err) throw err;
                console.log(item);
                client.close();
            });
        });
        res.redirect('/')
    }

});

app.use(express.static("content"));
app.listen(PORT, HOST, () => {
    console.log(`Started server. Serving http://${HOST}:${PORT}`);
});