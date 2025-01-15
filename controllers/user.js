require("dotenv").config();

const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const session = require("express-session");
const User = require("../models/user.js");


//passport google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            //check if user already exists
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = await User.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName
                });
            }
            return done(null, user);

        } catch (error) {
            console.log("Error during login", error);
            return done(error, null);
        }
    }
));

//serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

//deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = User.findById(id);
        done(null, user);

    } catch (error) {
        console.log("Deserialisation error", error);
        done(error, null);
    }
});


//controller functions

exports.getHomePage = (req, res, next) => {
    res.sendFile('homePage.html', { root: "./public" });
}


exports.getDashboard = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.sendFile('dashboard.html', { root: './public' });
};


exports.logout = (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
};


// //middleware for authentication
// exports.isAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return next();

//     }
//     res.redirect("/");
// }
