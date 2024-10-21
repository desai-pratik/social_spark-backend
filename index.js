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
const Post = require("./models/Post");
const User = require('./models/User');
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

/// Search endpoint
app.get('/api/search', async (req, res) => {
    const query = req.query.q;

    try {
        const userResults = await User.find({ $text: { $search: query } });
        const postResults = await Post.find({ $text: { $search: query } });
    
        const results = {
            users: userResults,
            posts: postResults,
        };

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get("/", (req, res) => {
    res.send('welcome to home page')
});

const server = app.listen(4000, () => {
    console.log("Backend server is running on port of 4000");
});

// this is for chat (socket.io)
const io = require('socket.io')(server, {
    pingTimeout: 6000,  // this is for waiting second
    cors: {
        origin: "https://socialspark01.netlify.app", // this is solve cors error for chat. this is frontend link
        // origin: "http://localhost:3000",  // this is solve cors error for chat. this is frontend link
    },
});

let onlineUsers = new Map();
io.on("connection", (socket) => {

    socket.on('setup', (userData) => {
        socket.join(userData._id);
        onlineUsers.set(userData._id, { socketId: socket.id, username: userData.username, profilePicture: userData.profilePicture });
        io.emit('online users', Array.from(onlineUsers.values()));
        socket.emit("connected");
    });

    socket.on('join chat', (room) => {
        socket.join(room);
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
        chat.users.forEach(user => {
            if (user._id == newMessageReceived.sender._id) return;

            socket.in(user._id).emit("message received", newMessageReceived)
        });
    });

    socket.on('disconnect', () => {
        onlineUsers.forEach((value, key) => {
            if (value.socketId === socket.id) {
                onlineUsers.delete(key);
            }
        });
        io.emit('online users', Array.from(onlineUsers.values()));
    });

    socket.on('delete messages', ({ chatId, messageIds }) => {
        socket.to(chatId).emit("messages deleted", { messageIds });
    });

    socket.off('setup', () => {
        socket.leave(userData._id);
    });
})