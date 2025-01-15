const express = require("express");
const path = require("path");
const cors = require("cors");

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

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})