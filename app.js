require('dotenv').config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const user_routes = require("./routes/user.js");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "./public", "homePage.html"));
})


app.use(user_routes);

mongoose.connect(`mongodb+srv://fetchsubhankar:${process.env.DATABASE_PASSWORD}@urlshortener.rop3w.mongodb.net/?retryWrites=true&w=majority&appName=URLShortener`)
    .then(() => {
        console.log("Connected to mongoDB");
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log(error)
    })
