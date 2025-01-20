const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AnalyticsSchema = new Schema({
    urlId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Url',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    userAgent: String,
    ipAddress: String,
    osType: String,
    deviceType: String,
});

module.exports = mongoose.model("Analytics", AnalyticsSchema);