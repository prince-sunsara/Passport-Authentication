//jshint esversion:6
require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); // level 2 security
// const  md5 = require("md5"); // level 3 security (hashing)

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

// mongoDB work
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});


/* security purpose (encryption) */
// userSchema.plugin(encrypt, { secret : process.env.SECRET, encryptedFields: ['password']}); // level 2 seccurity

const User = new mongoose.model("User", userSchema);

// home route 
app.get("/", (req, res) => {
    res.render("home");
});


// login route 
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const userEmail = req.body.username;
    const userPassword = md5(req.body.password);

    User.findOne({email: userEmail}).then((user) => {
        if(user.password === userPassword) {
            res.render("secrets");
        } else {
            console.log("Enter correct password");
        }
    }).catch((err) => {
        console.log(err);
    })
});


// register route
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save().then(() => {
        console.log("Successfully created new user.");
        res.render("secrets");
    }).catch((err) => {
        console.log(err);
    });
});


// logout route
app.get("/logout", (req, res) => {
    res.redirect("/");
})


app.listen(3000, () => {
    console.log("Server running on port 3000.");
});