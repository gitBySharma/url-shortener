const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analytics.js");
const authentication = require("../middleware/auth.js");
const rateLimit = require("../middleware/rateLimit.js");


//route to get overall analytics of a user
router.get("/api/analytics/overall", authentication.authenticate, rateLimit.shortUrlLimiter, analyticsController.getOverallAnalytics);

//route to get analytics of a short url
router.get("/api/analytics/:alias", authentication.authenticate, rateLimit.shortUrlLimiter, analyticsController.getUrlAnalytics);

//route to get analytics of a topic
router.get("/api/analytics/topic/:topic", authentication.authenticate, rateLimit.shortUrlLimiter, analyticsController.getTopicAnalytics);



module.exports = router;
