/**
 * File: server.js
 * @author Theo Technicguy, Sorio
 * @version 0.1.1
 */

// Setup server
const path = require("path");

const express = require("express");
const consolidate = require("consolidate");
const mongo = require("mongodb").MongoClient;
const app = express();
const url = "mongodb://localhost:27017/";
app.use(express.urlencoded({
    extended: true
  }));

// By default, express sets a tag `X-Powered-By`. Disable this
app.disable("x-powered-by");

// Set rendering engine and views
app.engine("html", consolidate.hogan);
app.set("views", "views");
// Set public assets folder
app.use(express.static(path.join(__dirname, 'public/')));

app.get(["/", "/index", "/index.html"],(req,res,next)=>{
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.query.user == null) {
        user_param = {};
    } else {
        user_param = {"user": {"name": req.query.user}};
    }
    mongo.connect(url,(err,client)=>{
        if (err) throw err;
        var dbo = client.db("users");
        dbo.collection("incidents").find({}).toArray((err, result) => {
                if (err)throw err;
                res.render("index.html", { result, user_param });
                client.close();
            });
      });
});

app.get("/login", (req, res) => {
    res.render("login.html");
});

app.get(["/report", "/new_incident"], (req, res) => {
    let user_param;
    // Make user_param empty if no user is supplied.
    if (req.query.user == null) {
        user_param = {};
    } else {
        user_param = {"user": {"name": req.query.user}};
    }
    res.render("new_incident.html",user_param);
});

app.post("/insert",(req,res)=>{
    let user_param="utilisateur";
    var item ={
        description: req.body.description,
        adresse: req.body.adresse,
        date :new Date().toLocaleDateString() ,
        author:user_param
    };

    mongo.connect(url,(err,client)=>{
        if (err) throw err;
        var dbo = client.db("users");
        dbo.collection("incidents").insertOne(item, function(err, result) {
          if (err) throw err;
          console.log(item);
          client.close();
        });
      });
    
      res.redirect('/')
});
app.use(express.static("content"));
app.listen(8080);