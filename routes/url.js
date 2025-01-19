const express = require("express");
const router = express.Router();

const urlController = require("../controllers/url.js");
const authentication = require("../middleware/auth.js");
const rateLimit = require("../middleware/rateLimit.js");


//route for creating short url
router.post("/api/shorten/", authentication.authenticate, rateLimit.shortUrlLimiter, urlController.createShortUrl);


module.exports = router;