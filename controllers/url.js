require("dotenv").config();
const shortid = require("shortid");
const axios = require("axios");

const Url = require("../models/url.js");
const Analytics = require("../models/analytics.js");



// Utility function to detect device type
const getDeviceType = (userAgent) => {
    if (/mobile/i.test(userAgent)) return "mobile";
    if (/tablet/i.test(userAgent)) return "tablet";
    return "desktop";
};



//function to create a shorturl
exports.createShortUrl = async (req, res, next) => {
    try {
        const { longUrl, customAlias, topic } = req.body;

        //validate long url
        if (!longUrl) {
            return res.status(400).json({ message: "Please provide a valid long url" });
        }

        //user specific rate limiting
        const oneMinuteAgo = new Date(Date.now() - 60000);
        const urlCount = await Url.countDocuments({
            userId: req.user.id,
            createdAt: { $gte: oneMinuteAgo }
        });

        if (urlCount >= 5) {
            return res.status(429).json({ message: "Rate limit exceeded. Try again later" });
        }

        //determine the shorturl
        let shortUrl = customAlias || shortid.generate();

        //check uniqueness
        const existingUrl = await Url.findOne({ shortUrl });
        if (existingUrl) {
            return res.status(400).json({ message: "Alias already exists. Please choose a different one" });
        }

        //create new shorturl
        const newUrl = await Url.create({
            userId: req.user.id,
            longUrl,
            shortUrl,
            topic
        });

        //success response
        res.status(200).json({
            message: "Short url created successfully",
            shortUrl: newUrl.shortUrl,
            createdAt: newUrl.createdAt
        })

    } catch (error) {
        console.log("ShortUrl creation error:", error);
        res.status(500).json({ message: "Internal server error" });

    }
};


//function to log analytics and redirect shorturl
exports.redirectShortUrl = async (req, res, next) => {
    try {
        const { alias } = req.params;

        //find the original url by alias
        const url = await Url.findOne({ shortUrl: alias });
        if (!url) {
            return res.status(404).json({ message: "Url not found" });
        }

        // Increment the clicks count for the URL
        await Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1 } });

        //log analytics data
        const userAgent = req.headers["user-agent"];
        const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;  //handle localhost ip
        const osType = /Windows|Mac|Linux|Android|iOS/.exec(userAgent)?.[0] || "Other";
        const deviceType = getDeviceType(userAgent);

        const timestamp = new Date();

        //get geolocation data
        const geoResponse = await axios.get(`http://ip-api.com/json/${ipAddress}`)
        const geolocation = geoResponse.data;

        console.log("Short url analytics:", {
            timestamp,
            userAgent,
            ipAddress,
            geolocation
        });

        //store click data in analytics
        await Analytics.create({
            urlId: url._id,
            userId: url.userId,
            timestamp,
            userAgent,
            ipAddress,
            osType,
            deviceType
        });

        res.redirect(url.longUrl);

    } catch (error) {
        console.log("Error redirecting short url:", error);
        res.status(500).json({ message: "Internal server error" });

    }
};