/**
 * File: server.js
 * @author Theo Technicguy
 * @version 0.0.2
 */

// Setup server
const path = require("path");

const express = require("express");
const consolidate = require("consolidate");

const app = express();

// By default, express sets a tag `X-Powered-By`. Disable this
app.disable("x-powered-by");

// Set rendering engine and views
app.engine("html", consolidate.hogan);
app.set("views", "views");
// Set public assets folder
app.use(express.static(path.join(__dirname, 'public/')));

// Set available sites
app.get(["/", "/index", "/index.html"], (req, res) => {
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.query.user == null) {
        user_param = {};
    } else {
        user_param = {"user": {"name": req.query.user}};
    }

    res.render("index.html", user_param);
});

app.get("/login", (req, res) => {
    res.render("login.html");
});

app.get(["/report", "/new_incident"], (req, res) => {
    res.render("new_incident.html");
});

app.use(express.static("content"));
app.listen(8080);