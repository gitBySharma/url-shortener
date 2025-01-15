const express = require("express");
const userController = require("../controllers/user.js")

const router = express.Router();

router.get("/user-login", userController.google_authentication);


module.exports = router;