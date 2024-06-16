const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require("multer")
const userRoute = require("./routes/users")
const authRoute = require("./routes/auth")
const postRoute = require("./routes/posts")
const cors = require('cors');


dotenv.config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONG_URL);
        console.log("Connected to mongoose successfully");
    } catch (error) {
        console.error("Could not connect to mongoose", error);
        process.exit(1);
    }
};

connectDB();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('common'));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        db(null, "public/images")
    },
    filename: (req, file, cb) => {
        db(null, file.originalname)
    }
})
const upload = multer({ storage });

app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        return res.status(200).json("File uploaded successfully.")
    } catch (error) {
        console.log(error);
    }
})



app.use("/api/user", userRoute)
app.use("/api/auth", authRoute)
app.use("/api/posts", postRoute)

app.get("/", (req, res) => {
    res.send('welcome to home page')
})
app.listen(4000, () => {
    console.log("Backend server is running on port of 4000");
})


