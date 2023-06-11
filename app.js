//jshint esversion:6
require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
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
    googleID: String,
    secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// Simplified Passport/Passport-Local Configuration
passport.use(User.createStrategy());

// saves the user session with google account 
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});


// google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/secrets",
    scope: ['profile', 'email']
}, (accessToken, refreshToken, profile, cb) => {
    // console.log(profile);
    User.findOrCreate({ username: profile.emails[0].value, googleID: profile.id }, function (err, user) {
        return cb(err, user);
    });
}
));


// home route 
app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
    (req, res) => {
        // Successfull authentication, redirect to secrets.
        res.redirect("/auth/google/secrets");
    }
);

app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    });

// register route
app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register({ username: req.body.username }, req.body.password, (err, user) => {
            if (err) {
                // console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, (err) => {
                    if (!err) res.redirect("/secrets");
                    else console.log(err);
                });
            }
        });
    });

// login route 
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.logIn(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });
    });


// secrets route
app.get("/secrets", (req, res) => {
    User.find({ "secret": { $ne: null } }).then((users) => {
        res.render("secrets", { usersWithSecrets: users })
    }).catch((err) => {
        console.log(err);
    });
});

// submit route
app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) res.render("submit");
        else res.redirect("/login");
    })
    .post((req, res) => {
        const submittedSecrete = req.body.secret;
        // console.log(req.user.id);

        User.findById(req.user.id).then((user) => {
            user.secret = submittedSecrete;
            user.save().then(() => {
                res.redirect("/secrets");
            });
        }).catch((err) => {
            console.log(err);
        });
    });


// logout route
app.get("/logout", (req, res, next) => {
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});


app.listen(3000, () => {
    console.log("Server running on port 3000.");
});