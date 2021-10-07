/**
 * File: server.js
 * @author Theo Technicguy
 * @version 0.0.1
 */

// Setup server
var express = require("express");
var consolidate = require("consolidate");
var app = express();

// By default, express sets a tag `X-Powered-By`. Disable this
app.disable("x-powered-by");

// Set rendering engine and views
app.engine("html", consolidate.hogan);
app.set("views", "content");

// Set available sites
app.get(["/", "/index", "/index.html"], (req, res) => {
    res.render("index.html");
});

app.get("/login", (req, res) => {
    res.render("login.html");
});

app.get(["/report", "/new_incident"], (req, res) => {
    res.render("report.html");
});

app.get('/user_id', (req, res) => {
    res.render("index.html",{username:req.query.username});
});

app.use(express.static("content"));
app.listen(8080);