require("dotenv").config();

const jwt = require("jsonwebtoken");
const User = require("../models/user.js");


//middleware for authentication
exports.authenticate = async (req, res, next) => {
    try {
        //for first successful login token is received as query and as Authorization header for rest of the calls
        const token = req.header("Authorization") ? req.header("Authorization") : req.query.token;
        if (!token) {
            return res.status(401).send("Access denied. No token provided.");

        }
        //verify token
        let decodedUser;
        try {
            decodedUser = jwt.verify(token, process.env.JWT_SECRET);

        } catch (error) {
            console.log("Token error", error);
            // Handle expired token error
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token has expired. Please login again." });
            }
            return res.status(401).json({ error: "Invalid token." });

        }

        const user = await User.findById(decodedUser.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });

        }

        req.user = user;
        next();

    } catch (error) {
        console.log("Authentication error", error);
        res.status(500).json({ message: "Internal server error" });

    }
}