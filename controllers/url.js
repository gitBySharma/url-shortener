require("dotenv").config();
const shortid = require("shortid");
const axios = require("axios");

const Url = require("../models/url.js");
const Analytics = require("../models/analytics.js");
const User = require("../models/user.js");



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
            createdAt: newUrl.createdAt,
            base_website: process.env.WEBSITE
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
        const geoResponse = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,zip,lat,lon,query`)
        const geolocation = geoResponse.data;

        if (geolocation.status === "success") {
            //store click data in analytics
            await Analytics.create({
                urlId: url._id,
                userId: url.userId,
                timestamp,
                userAgent,
                ipAddress,
                osType,
                deviceType,
                geoLocationData: {
                    query: geolocation.query,
                    status: geolocation.status,
                    country: geolocation.country,
                    regionName: geolocation.regionName,
                    city: geolocation.city,
                    zip: geolocation.zip,
                    lat: geolocation.lat,
                    lon: geolocation.lon
                }
            });

        } else {
            await Analytics.create({
                urlId: url._id,
                userId: url.userId,
                timestamp,
                userAgent,
                ipAddress,
                osType,
                deviceType,
                geoLocationData: {
                    query: geolocation.query,
                    status: geolocation.status,
                    message: geolocation.message
                }
            });
        }

        res.redirect(url.longUrl);

        // res.status(200).json({ url: url.longUrl });

    } catch (error) {
        console.log("Error redirecting short url:", error);
        res.status(500).json({ message: "Internal server error" });

    }
};


//function to get all the urls of an user
exports.getURLs = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { search, topic } = req.query;

        let query = { userId };

        // Add search conditions if search term exists
        if (search) {
            // Create case-insensitive search
            query.$or = [
                { shortUrl: { $regex: search, $options: 'i' } },
                { longUrl: { $regex: search, $options: 'i' } }
            ];
        }

        // Add topic filter if specified
        if (topic) {
            query.topic = topic;
        }

        // Execute query
        const urls = await Url.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean(); // Convert to plain JavaScript objects for better performance

        if (!urls) {
            return res.status(404).json({ message: "No urls found" });
        }

        res.status(200).json({ urls: urls });

    } catch (error) {
        console.log("URLs fetching error", error);
        res.status(500).json({ message: "Internal server error" });
    }
}