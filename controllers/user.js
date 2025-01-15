const express = require("express");

exports.google_authentication = (req, res, next) => {
    res.status(200).json({ success: true });
}
