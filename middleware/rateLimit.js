const rateLimit = require('express-rate-limit');

exports.shortUrlLimiter = rateLimit({
    windowMs:15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    message: "Too many requests. Please try again later"
});