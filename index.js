const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const chatRoute = require("./routes/chat");
const messagesRoute = require("./routes/messages");
const cors = require('cors');

dotenv.config();
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
app.use("/api/user", userRoute)
app.use("/api/auth", authRoute)
app.use("/api/posts", postRoute)
app.use("/api/chats", chatRoute)
app.use("/api/messages", messagesRoute)

app.get("/", (req, res) => {
    res.send('welcome to home page')
})
const server = app.listen(4000, () => {
    console.log("Backend server is running on port of 4000");
})

// this is for chat (socket.io)
const io = require('socket.io')(server, {
    pingTimeout: 6000,  // this is for waiting second
    cors: {
        origin: "http://localhost:3000",  // this is solve cors error for chat. this is frontend link
    },
});

io.on("connection", (socket) => {
    // console.log("connected to socket.io");

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        // console.log(userData._id);
        socket.emit("connected");
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        // console.log("User Join Room:" + room);
    });

    socket.on('typing', (room) => {
        socket.in(room).emit("typing");
    });

    socket.on('stop typing', (room) => {
        socket.in(room).emit("stop typing");
    });

    socket.on('new message', (newMessageReceived) => {
        var chat = newMessageReceived.chat;
        if (!chat.users) return;
        //  console.log('chat.users not defined');

        chat.users.forEach(user => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived)
        });
    })

    socket.off('setup', () => {
        // console.log("User Disconnected");
        socket.leave(userData._id);
    });
})