require("dotenv").config();

const path = require("path");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/user.js");


const client = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URL,
});

exports.googleAuth = async (req, res,) => {
    try {
        //generate google Oauth url
        const url = client.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "consent",
            include_granted_scopes: true
        });

        res.status(200).json({ url: url });

    } catch (error) {
        console.log("Error getting auth url", error);
        res.status(500).json({ message: "Authentication failed" });
    }
};


exports.googleCallback = async (req, res, next) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.status(400).json({ message: "Invalid request. Authrization code required" });
        }

        //exchange code for tokens
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Get user info using the access token
        const oauth2Client = new OAuth2Client();
        oauth2Client.setCredentials({ access_token: tokens.access_token });

        const url = 'https://www.googleapis.com/oauth2/v2/userinfo';
        const response = await oauth2Client.request({ url });
        const userInfo = response.data;

        // Find or create user
        let user = await User.findOne({ googleId: userInfo.id });
        if (!user) {
            user = await User.create({
                googleId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name
            });
        }

        //generate JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // //json response for backend only api
        // res.status(200).json({
        //     token,
        //     user: {
        //         id: user.id,
        //         name: user.name,
        //         email: user.email
        //     }
        // });

        //redirected response for frontend simulation
        res.redirect(`/dashboard?token=${token}`);

    } catch (error) {
        console.log("Error during callback", error);
        res.status(500).json({ message: "Authentication failed" });

    }
};



//function to get dashboard
exports.getDashboard = async (req, res, next) => {
    res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
}


//function to get a user's data
exports.getUserDashboardData = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });

        }

        res.status(200).json({ user });

    } catch (error) {
        console.log("Error fetching user's data", error);
        res.status(500).json({ message: "Failed to fetch user's data" });

    }
}