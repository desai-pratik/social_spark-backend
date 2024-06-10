const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoute = require("./routes/users")
const authRoute = require("./routes/auth")
const postRoute = require("./routes/posts")

dotenv.config()

// Use async/await to connect to mongoose
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONG_URL);
        console.log("Connected to mongoose successfully");
    } catch (error) {
        console.error("Could not connect to mongoose", error);
        process.exit(1); // Exit process with failure
    }
};

connectDB();


app.use(express.json());
app.use(helmet());
app.use(morgan('common'));

app.use("/api/user", userRoute)
app.use("/api/auth", authRoute)
app.use("/api/posts", postRoute)




app.get("/", (req, res) => {
    res.send('welcome to home page')
})



app.listen(4000, () => {
    console.log("Backend server is running on port of 4000");
})