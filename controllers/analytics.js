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

        // Clicks by date for the last 7 days
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
                    date: "$_id", // Rename _id to date
                    clickCount: 1,
                    _id: 0, // Remove _id field from the output
                },
            },
        ]);

        // OS type breakdown
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
                    _id: 0, // Remove _id field from the output
                },
            },
        ]);

        // Device type breakdown
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
                    _id: 0, // Remove _id field from the output
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
        console.log("Error fetching analytics:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



//fucntion for analytics based on topic
exports.getTopicAnalytics = async (req, res, next) => {
    try {
        const { topic } = req.params;

        // Validate if topic is valid (matches enum values in URL model)
        if (!["acquisition", "activation", "retention", "other"].includes(topic)) {
            return res.status(400).json({ message: "Invalid topic" });
        }

        // Find all URLs for this topic belonging to the authenticated user
        const urls = await Url.find({
            topic: topic,
            userId: req.user.id
        });

        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for this topic" });
        }

        // Get all URL IDs for this topic
        const urlIds = urls.map(url => url._id);

        // Calculate total clicks across all URLs in the topic
        const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

        // Get unique users across all URLs in the topic
        const uniqueUsers = (await Analytics.distinct("ipAddress", {
            urlId: { $in: urlIds }
        })).length;

        // Get clicks by date for the last 30 days for all URLs in the topic
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
        const urlStats = await Promise.all(urls.map(async (url) => {
            const uniqueUrlUsers = (await Analytics.distinct("ipAddress", {
                urlId: url._id
            })).length;

            return {
                shortUrl: url.shortUrl,
                totalClicks: url.clicks,
                uniqueUsers: uniqueUrlUsers
            };
        }));

        // Send response with all analytics data
        res.status(200).json({
            topic,
            totalClicks,
            uniqueUsers,
            clicksByDate,
            urls: urlStats
        });

    } catch (error) {
        console.log("Error fetching topic analytics", error);
        res.status(500).json({ message: "Internal server error" });

    }
};