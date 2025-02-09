const express = require("express");

const userController = require("../controllers/user.js")
const authentication = require("../middleware/auth.js");


const router = express.Router();

// //google auth routes
router.get("/auth/google/url", userController.googleAuth);
router.get("/auth/google/callback", userController.googleCallback);



//route to handle dashboard loading after successful login
router.get("/dashboard", userController.getDashboard);

//getting user's dasboard and it's data
router.get("/dashboard/user/data/", authentication.authenticate, userController.getUserDashboardData);


module.exports = router;