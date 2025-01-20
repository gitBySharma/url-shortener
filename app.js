require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const User = require("./models/user.js");
const Url = require("./models/url.js");

const userController = require("./controllers/user.js");

const user_routes = require("./routes/user.js");
const url_routes = require("./routes/url.js");


const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("trust proxy", 1); //trust the first proxy (e.g when using Nginx)


app.use(user_routes);
app.use(url_routes);



mongoose.connect(`mongodb+srv://fetchsubhankar:${process.env.DATABASE_PASSWORD}@urlshortener.rop3w.mongodb.net/url_shortener?retryWrites=true&w=majority&appName=URLShortener`)
    .then(() => {
        console.log("Connected to mongoDB");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log(error)
    })
