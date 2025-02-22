require('dotenv').config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const User = require("./models/user.js");
const Url = require("./models/url.js");
const Analytics = require("./models/analytics.js");


const user_routes = require("./routes/user.js");
const url_routes = require("./routes/url.js");
const analyticsRoutes = require("./routes/analytics.js");


const app = express();

//middlewares
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("trust proxy", 1); //trust the first proxy (e.g when using Nginx)


//middleware for base route
app.get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, './public', 'homePage.html'));
});



app.use(user_routes);
app.use(url_routes);
app.use(analyticsRoutes);



mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
        console.log("Connected to mongoDB");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log(error)
    })
