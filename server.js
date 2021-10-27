/**
 * File: server.js
 * @author Theo Technicguy, Sorio
 * @version 0.1.9
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

const config = require("./config/config");
const db = require("./db/mongoConnector");
const utils = require("./utils");
const { ObjectId } = require("mongodb");

// --- Config ---
const HOST = config.HOST;
const PORT = config.PORT;
const SECRET = config.SECRET;

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
        res.render("login.html", {"errors": [{"error": "Il faut remplir toutes les entrées!"}]});

        // Break out of function
        return;
    }

    // Ease username access
    const username = req.body.username;
    // Get username from database
    const user = (await db.getUser(username));

    // Hash password with salt
    // We use SHA-2 as SHA-1 is getting phased out.
    let password = utils.hash(req.body.password);
    if(user===null){res.render("login.html",{"errors": [{"error": "La combinaison utilisateur/mot de passe donnée est inexistante."}]});return;};
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
        res.render("login.html",
            {"errors": [{"error": "La combinaison utilisateur/mot de passe donnée est inexistante."}]});
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
        res.render("login.html", {"errors": [{"error": "Il faut remplir toutes les entrées!"}]});
        return;
    }

    // Check if user already exists
    // Usernames have to be unique.
    if (await db.getUser(body.username)) {
        res.render("login.html", {"errors": [{"error": "Ce nom d'utilisateur est déjà pris."}]});
        return;
    }

    // Validate email
    // TODO: Validate email by sending a verification email
    const emailRE = /[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/
    if (!emailRE.test(body.email)) {
        res.render("login.html", {"errors": [{"error": "L'email ne semble pas correcte."}]});
        return;
    }

    // Check that passwords are equal
    if (body.password !== body.password2) {
        res.render("login.html", {"errors": [{"error": "Les mots de passes ne coincident pas."}]});
        return;
    }

    // Create data structure to transmit
    const data = {
        "username": body.username,
        "display_name": body.display_name,
        "email": body.email,
        "password": utils.hash(body.password)
    };

    await db.createUser(data);

    res.render("login.html", {"successes": [{"success": `Bienvenue ${data.display_name}!\nConnectez-vous et envoyez votre premier incident.`}]});
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
            description: req.body.desc,
            adresse: req.body.adr,
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

/**
 * Incident page
 * @method get
 * @path /show_incident
 */
app.get("/show_incident", (req, res) => {
    var query = require('url').parse(req.url,true).query;
    let id = query.id;
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.session.username == null) {
        user_param = {}
    } else {
        user_param = {"user": {"name": req.session.username}};
    }
    //find the incident with desired id
    mongo.connect(config.DB_URL, (err, client) => {
        if (err) throw err;
        var dbo = client.db("users");
        dbo.collection("incidents").findOne({"_id":ObjectId(id)},(err, result) => {
            if (err) throw err;

            res.render("show_incident.html", {result, user_param});
            client.close();
        });
    });
    
   
});
/**
 * update page
 * @method post
 * @path /update
 */
app.post("/update", (req, res) => {
    var query = require('url').parse(req.url,true).query;
    let id = query.id;
    if (req.session.username == null) {
        res.redirect('/login')
    } else {
        let user_param = req.session.username;
        var item = {
            description: req.body.desc,
            adresse: req.body.adr,
            date: new Date().toLocaleDateString(),
            author: user_param
        };

        mongo.connect(config.DB_URL, (err, client) => {
            if (err) throw err;
            var dbo = client.db("users");
            dbo.collection("incidents").deleteOne({"_id":ObjectId(id)});
            dbo.collection("incidents").updateOne({"_id":ObjectId(id)},{$set:item},{ new: true, upsert: true, returnOriginal: false }, function (err) {
                if (err) throw err;
                console.log(item);
                client.close();
            });
        });
        res.redirect('/')
    }

});
//delete
app.get("/delete", (req, res) => {
    var query = require('url').parse(req.url,true).query;
    let id = query.id;
    if (req.session.username == null) {
        res.redirect('/login')
    } else {
        let user_param = req.session.username;
        
        mongo.connect(config.DB_URL, (err, client) => {
            if (err) throw err;
            var dbo = client.db("users");
            dbo.collection("incidents").deleteOne({"_id":ObjectId(id)}); 
        });
        res.redirect('/')
    }

});
app.use(express.static("content"));
app.listen(PORT, HOST, () => {
    console.log(`Started server. Serving http://${HOST}:${PORT}`);
});