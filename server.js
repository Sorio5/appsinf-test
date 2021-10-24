/**
 * File: server.js
 * @author Theo Technicguy, Sorio
 * @version 0.1.4
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

app.post("/ident", (req, res) => {
    // Filter out incomplete responses
    if (!req.body.username || !req.body.password) {
        // TODO: Send error feedback.
        res.redirect("/login");

        // Break out of function
        return;
    }

    // Hash password with salt
    // We use SHA-2 as SHA-1 is getting phased out.
    let password = crypto.createHash("sha256").update(req.body.password).update(SALT).digest("hex");
    let username = req.body.username


    if (username === "me" && password === crypto.createHash("sha256").update("secret").update(SALT).digest("hex")) {
        req.session.username = username;
        res.redirect("/report");
    } else {
        // TODO: Send error feedback.
        res.redirect("/login");
    }
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