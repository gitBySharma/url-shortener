require("dotenv").config();
const shortid = require("shortid");

const Url = require("../models/url.js");


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
            shortUrl: `${process.env.BASE_URL}/${newUrl.shortUrl}`,
            createdAt: newUrl.createdAt
        })

    } catch (error) {
        console.log("ShortUrl creation error:", error);
        res.status(500).json({ message: "Internal server error" });

    }
};