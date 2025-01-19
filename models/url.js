const mongoose = require("mongoose");
const shortid = require("shortid");

const Schema = mongoose.Schema;

const UrlSchema = new Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortUrl: {
        type: String,
        unique: true,
        default: shortid.generate
    },
    topic: {
        type: String,
        enum: ["acquisition", "activation", "retention", "other"],
        default: "other"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },

}, { timestamps: true });


module.exports = mongoose.model("Url", UrlSchema);