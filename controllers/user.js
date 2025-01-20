require("dotenv").config();

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

        res.status(200).json({ url });

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

        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.log("Error during callback", error);
        res.status(500).json({ message: "Authentication failed" });

    }
};