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