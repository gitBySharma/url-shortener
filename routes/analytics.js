const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analytics.js");
const authentication = require("../middleware/auth.js");
const rateLimit = require("../middleware/rateLimit.js");


//route to get analytics of a short url
router.get("/api/analytics/:alias", authentication.authenticate, rateLimit.shortUrlLimiter, analyticsController.getUrlAnalytics);


module.exports = router;
