const express = require("express");
const passport = require("passport");
const authentication = require("../middleware/auth.js");
const userController = require("../controllers/user.js")


const router = express.Router();


//base route
router.get("/", userController.getHomePage);


//google auth routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }))

router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("/dashboard");
    }
);


router.get("/dashboard", authentication.isAuthenticated, userController.getDashboard);

router.get("/logout", userController.logout);



module.exports = router;