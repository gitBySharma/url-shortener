require("dotenv").config();

const moment = require("moment");

const Url = require("../models/url.js");
const Analytics = require("../models/analytics.js");


// Analytics API for a specific URL
exports.getUrlAnalytics = async (req, res, next) => {
    try {
        const { alias } = req.params;

        // Find URL by alias
        const url = await Url.findOne({ shortUrl: alias });
        if (!url) {
            return res.status(404).json({ message: "URL not found" });
        }

        // Total clicks and unique users
        // const totalClicks = await Analytics.countDocuments({ urlId: url._id });
        const totalClicks = url.clicks;
        const uniqueUsers = (await Analytics.distinct("ipAddress", { urlId: url._id })).length;

        // Clicks by date of the last 7 days
        const clicksByDate = await Analytics.aggregate([
            { $match: { urlId: url._id, timestamp: { $gte: moment().subtract(7, "days").toDate() } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    clickCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    date: "$_id",
                    clickCount: 1,
                    _id: 0,
                },
            },
        ]);

        // OS type data
        const osType = await Analytics.aggregate([
            { $match: { urlId: url._id } },
            {
                $group: {
                    _id: "$osType",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    osName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0,
                },
            },
        ]);

        // Device type data
        const deviceType = await Analytics.aggregate([
            { $match: { urlId: url._id } },
            {
                $group: {
                    _id: "$deviceType",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    deviceName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0,
                },
            },
        ]);

        res.status(200).json({
            totalClicks,
            uniqueUsers,
            clicksByDate,
            osType,
            deviceType,
        });

    } catch (error) {
        console.log("Analytics fetching error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



//fucntion for analytics based on topic
exports.getTopicAnalytics = async (req, res, next) => {
    try {
        const { topic } = req.params;

        // check if the topic is valid 
        if (!["acquisition", "activation", "retention", "other"].includes(topic)) {
            return res.status(400).json({ message: "Invalid topic" });
        }

        // Find all URLs for this topic for the authenticated user
        const urls = await Url.find({
            topic: topic,
            userId: req.user.id
        });

        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for this topic" });
        }

        // Get all URL IDs for this topic
        const urlIds = urls.map(url => url._id);

        // Calculate total clicks on all URLs of the topic
        const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

        // Get unique users of all URLs of the topic
        const uniqueUsers = (await Analytics.distinct("ipAddress", {
            urlId: { $in: urlIds }
        })).length;

        // Get clicks of last 30 days for all URLs in the topic
        const clicksByDate = await Analytics.aggregate([
            {
                $match: {
                    urlId: { $in: urlIds },
                    timestamp: {
                        $gte: moment().subtract(30, "days").toDate()
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    totalClicks: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    totalClicks: 1,
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);

        // Get detailed stats for each URL in the topic
        const urlData = await Promise.all(urls.map(async (url) => {
            const uniqueUrlUsers = (await Analytics.distinct("ipAddress", {
                urlId: url._id
            })).length;

            return {
                shortUrl: url.shortUrl,
                totalClicks: url.clicks,
                uniqueUsers: uniqueUrlUsers
            };
        }));


        res.status(200).json({
            topic,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            urls: urlData
        });

    } catch (error) {
        console.log("Topic analytics fetching error", error);
        res.status(500).json({ message: "Internal server error" });

    }
};




//function for overall analytics of a user
exports.getOverallAnalytics = async (req, res, next) => {
    try {
        //find all urls created by authenticated user
        const userUrls = await Url.find({ userId: req.user.id });

        //calculate total urls
        const totalUrls = userUrls.length;
        if (totalUrls === 0) {
            return res.status(404).json({ message: "No urls found for this user" })
        }

        //get all url IDs of the user
        const urlIds = userUrls.map((url) => url._id);

        //calculate total clicks of all URLs
        const totalClicks = userUrls.reduce((sum, url) => sum + url.clicks, 0);

        //get total unique users among all urls
        const uniqueUsers = (await Analytics.distinct("ipAddress", { urlId: { $in: urlIds } })).length;


        // Get clicks by date for all URLs in the last 30 days
        const clicksByDate = await Analytics.aggregate([
            {
                // Match records for the user's URLs in last 30 days
                $match: {
                    urlId: { $in: urlIds },
                    timestamp: {
                        $gte: moment().subtract(30, "days").toDate()
                    }
                }
            },
            {
                // Group by date and click count
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    totalClicks: { $sum: 1 }
                }
            },
            {
                // output format
                $project: {
                    date: "$_id",
                    totalClicks: 1,
                    _id: 0
                }
            },
            // Sort by date in ascending order
            { $sort: { date: 1 } }
        ]);

        // os type data with unique clicks and users
        const osType = await Analytics.aggregate([
            {
                // Match records for the user's URLs
                $match: {
                    urlId: { $in: urlIds }
                }
            },
            {
                // Group by OS type and calculate
                $group: {
                    _id: "$osType",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" }
                }
            },
            {
                // output format
                $project: {
                    osName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0
                }
            }
        ]);

        // device type data with unique clicks and users
        const deviceType = await Analytics.aggregate([
            {
                // Match records for the user's URLs
                $match: {
                    urlId: { $in: urlIds }
                }
            },
            {
                // Group by device type and calculate
                $group: {
                    _id: "$deviceType",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" }
                }
            },
            {
                // output format
                $project: {
                    deviceName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            totalUrls,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            osType,
            deviceType
        });

    } catch (error) {
        console.log("Overall analytics fetching error", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};