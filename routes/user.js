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
        const token = req.user.token;
        res.redirect(`http://localhost:3000/dashboard?token=${token}`);
        // res.status(200).json({ message: "Login successfull", token: token });
    }
);


router.get("/dashboard", userController.getDashboard);

router.get("/dashboard/user/data", authentication.authenticate, userController.getDashboardData);




module.exports = router;