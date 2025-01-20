const express = require("express");

const userController = require("../controllers/user.js")


const router = express.Router();

// //google auth routes
router.get("/auth/google/url", userController.googleAuth);
router.get("/auth/google/callback", userController.googleCallback);


module.exports = router;