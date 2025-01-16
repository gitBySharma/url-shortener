require("dotenv").config();

const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
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

            //generate JWT token
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            user.token = token;

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


exports.getDashboardData = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });

    }
    res.status(200).json({
        message: "Welcome to dashboard",
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        },
    });
};
