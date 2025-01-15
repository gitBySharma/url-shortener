const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Users", UserSchema);