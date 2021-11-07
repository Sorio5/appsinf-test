/**
 * File: server.js
 * @author Theo Technicguy, Sorio
 * @version 0.4.5
 */

// Imports and modules
const path = require("path");
const fs = require('fs');

const consolidate = require("consolidate");
const express = require("express");
const session = require('express-session');
const https = require('https');
const multer = require("multer");

const config = require("./config/config");
const db = require("./db/mongoConnector");
const utils = require("./utils");

// --- Config ---
const HOST = config.HOST;
const PORT = config.PORT;
const SECRET = config.SECRET;
const TLS = config.TLS;

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

// Set express sessions cookies
let session_settings = {
    // Server secret
    secret: SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        // Allow the cookie to be sent back to every page the server sends.
        path: '/',
        // Do no allow document.cookies API to access cookies
        httpOnly: true,
        // Require first-party interaction.
        // Don't send over cross-site reference.
        sameSite: true
    },
    // Name of the cookie
    name: "fmp-session",
    // Delete unset cookies
    unset: "destroy"
};

// Only set secure tag if we have TLS
if (!(!TLS || !TLS["KEY"] || !TLS["CRT"])) session_settings["cookie"]["secure"] = true;
app.use(session(session_settings));

// Set image upload folder
const upload = multer({dest: __dirname + "/public/uploads/img"});


// --- Routes ---
/**
 * favicon / tab icon serve
 * @method get
 * @path /favicon /favicon.ico
 */
app.get(["/favicon", "/favicon.ico"], (req, res) => {
    res.setHeader("Content-Type", "image/png");
    fs.createReadStream(path.join(__dirname, "public", "img", "logo.png")).pipe(res);
});

/**
 * Main/home page
 * @method get
 * @path / /index /index.html
 */
app.get(["/", "/index", "/index.html"], async (req, res) => {
    const user_param = utils.getUserParam(req);

    const results = await db.getAllIncidents();
    // Make data user friendly
    for (let i = 0; i < results.length; i++) {
        let this_result = results[i]
        // Change status language
        switch (this_result["status"]) {
            case "Work in Progress": this_result["status"] = "En cours"; break;
            case "Done": this_result["status"] = "Fini"; break;
            default: this_result["status"] = "Enregistré";
        }

        // Trim description
        this_result["description"] = this_result["description"].substr(0, 50);

        // Set author display name
        this_result["author"] = await db.getDisplayName(this_result["author"]);

        // Set date
        this_result["date"] = new Date(this_result["creation_date"]).toLocaleDateString();
    }

    res.render("index.html", {results, user_param});
});

/**
 * Initial Login page display
 * @method get
 * @path /login
 */
app.get("/login", (req, res) => {
    if (utils.userIsLogged(req)) res.redirect("/");
    res.render("login.html");
});

/**
 * Login confirmation page
 * @method post
 * @path /login
 */
app.post("/login", upload.none(), async (req, res) => {
    // Filter out incomplete responses
    if (!req.body.username || !req.body.password) {
        res.render("login.html", {"errors": [{"error": "Il faut remplir toutes les entrées!"}]});

        // Break out of function
        return;
    }

    // Ease username access
    const username = req.body.username;
    // Get username from database
    const user = await db.getUser(username);
    // Hash and salt password
    let password = utils.hash(req.body.password);

    if (user !== null && password === user.password) {
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
app.post("/register", upload.none(), async (req, res) => {
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

/**
 * Disconnect
 * @method get
 * @path /logout
 */
 app.get("/logout", (req, res) => {
    utils.disconnectUser(req);
    res.redirect("/login");
});

/**
 * Incident report page
 * @method get
 * @path /report /new_incident
 */
app.get(["/report", "/new_incident"], (req, res) => {
    // Make sure users are logged in
    if (utils.userIsLogged(req)) {
        res.render("new_incident.html", utils.getUserParam(req));
    } else {
        res.redirect("/login");
    }
});

/**
 * Incident creation page
 * @method post
 * @path /insert
 */
app.post("/insert", upload.single("image"), async (req, res) => {
    // Make sure users are logged in
    if (!utils.userIsLogged(req)) {
        res.redirect('/login')
    }

    const user_param = utils.getUserParam(req);

    // Check if user uploaded an image
    const image_path = utils.getFileName(req);

    // Create data
    const data = {
        description: req.body.desc,
        address: req.body.adr,
        author: user_param.user.name,
        image: image_path
    };

    // Insert data
    await db.createIncident(data);

    // Redirect to home page
    res.redirect("/");
});

/**
 * Incident page
 * @method get
 * @path /show_incident
 */
app.get("/show_incident", async (req, res) => {
    // Get current user
    const user_param = utils.getUserParam(req);

    // Get requested ID and incident
    const id = req.query.id;
    const incident = await db.getIncident(id);

    // Check if the user is the author
    let author;
    if (user_param.user != null) {
        author = user_param.user.name === incident.author;
    } else {
        author = false;
    }

    // Render the page
    res.render("show_incident.html", {incident, user_param, author});
});

/**
 * update page
 * @method post
 * @path /update
 */
app.post("/update", upload.single("image"), async (req, res) => {
    // Make sure user is logged in
    if (!utils.userIsLogged(req)) {
        res.redirect("/login")
    }

    // Get user
    const user_param = utils.getUserParam(req);

    // Get requested ID and incident
    const id = req.query.id;
    const incident = await db.getIncident(id);

    // Check if the user is the author
    let author;
    if (user_param.user != null) {
        author = user_param.user.name === incident.author;
    } else {
        author = false;
    }

    if (!author) {
        res.status(403).end();
    }

    let changes = false;
    const body = req.body;

    if (body.desc !== incident.description) {
        await db.updateIncident(id, "description", body.desc);
        changes = true;
    }

    if (body.adr !== incident.address) {
        await db.updateIncident(id, "address", body.adr);
        changes = true;
    }

    if (req.file) {
        await db.updateIncident(id, "image", utils.getFileName(req))
        changes = true;
    }

    if (changes) {
        await db.updateLastUpdate(id)
    }

    res.redirect('/')

});

/**
 * Delete an incident
 * @method get
 * @path /delete
 */
app.get("/delete", async (req, res) => {
    // Make sure user is logged in
    if (!utils.userIsLogged(req)) {
        res.redirect("/login")
    }

    // Get user
    const user_param = utils.getUserParam(req);

    // Get requested ID and incident
    const id = req.query.id;
    const incident = await db.getIncident(id);

    // Check if the user is the author
    let author;
    if (user_param.user != null) {
        author = user_param.user.name === incident.author;
    } else {
        author = false;
    }

    if (!author) {
        res.status(403).end();
    }

    await db.deleteIncident(id);

    res.redirect("/");
});

/**
 * search page
 * @method post
 * @path /search
 */
app.post("/search", upload.none(), async (req,res)=>{
    const user_param = utils.getUserParam(req);

    const search = req.body.searched;
    console.log(search);

    const results = await db.searchIncidents(search);
    console.log(results);

    if (results.length === 0) {
        res.render("index.html", {"errors": [{"error": "Aucune correspondance trouvée"}], user_param});
        return;
    }
    else{
        //make data user friendly
        for (let i = 0; i < results.length; i++) {
            // Change status language
            switch (results[i]["status"]) {
                case "Work in Progress": results[i]["status"] = "En cours"; break;
                case "Done": results[i]["status"] = "Fini"; break;
                default: results[i]["status"] = "Enregistré";
            }
    
            // Trim description
            results[i]["description"] = results[i]["description"].substr(0, 50);
    
            // Set date
            results[i]["date"] = new Date(results[i]["creation_date"]).toLocaleDateString();
        }
    }

    res.render("index.html", {results, user_param});
});


// Start server in HTTP if no TLS certificate is given
// Start an HTTPS otherwise
if (!TLS || !TLS["KEY"] || !TLS["CRT"]) {
    app.listen(PORT, HOST, () => {
        console.log(`Started server. Serving http://${HOST}:${PORT}` + "\nUsing HTTP. Consider setting up TLS for HTTPS!");
    });
} else {
    // Basic TLS configuration
    let tls_config = {
        key: fs.readFileSync(TLS["KEY"]),
        cert: fs.readFileSync(TLS["CRT"])
    };

    // Add Certificate Authority
    if (TLS["CA"]) {
        tls_config["ca"] = fs.readFileSync(TLS["CA"])
    }

    // Add passphrase
    if (TLS["PW"]) {
        tls_config["passphrase"] = TLS["PW"];
    }

    https.createServer(tls_config, app).listen(PORT, HOST);
    console.log(`Started server. Serving https://${HOST}:${PORT}`);
}
