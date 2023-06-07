//jshint esversion:6
require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// session 
app.use(session({
    secret: "This is my secrete.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// mongoDB work
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// Simplified Passport/Passport-Local Configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// home route 
app.get("/", (req, res) => {
    res.render("home");
});


// login route 
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.logIn(user, (err) => {
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    })
});


// register route
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    User.register({ username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

// secrets route
app.get("/secrets", (req, res) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

// logout route
app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/");
})


app.listen(3000, () => {
    console.log("Server running on port 3000.");
});