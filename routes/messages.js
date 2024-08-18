const router = require("express").Router();
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Message = require("../models/Message");
const Chat = require("../models/Chat");


// send message
router.post("/", verifyToken, async (req, res) => {
    const { content, chatId } = req.body;

    if (!content || !chatId) {
        // console.log("invalid data passed into request");
        return res.sendStatus(400);
    }
    var newMessage = {
        sender: req.user.id,
        content: content,
        chat: chatId,
    }
    try {
        var message = await Message.create(newMessage);
        message = await message.populate("sender", "username profilePicture");
        message = await message.populate("chat");

        message = await User.populate(message, {
            path: 'chat.users',
            select: 'username profilePicture email',
        });

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message,
        });

        res.json(message);
    } catch (error) {
        res.status(400);
        console.log(error);
    }
});


// get message in chat
router.get("/:chatId", verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "username profilePicture email")
            .populate("chat");

        res.json(messages);
    } catch (error) {
        res.status(400);
        console.log(error);
    }
});

router.delete("/:messageId", verifyToken, async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }
        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your messages" });
        }
        await Message.findByIdAndDelete(req.params.messageId);

        // const chat = await Chat.findById(message.chat);
        // if (!chat) {
        //     return res.status(404).json({ message: "Chat not found" });
        // }
        // io.to(chat._id).emit('messages deleted', { messageIds: [message._id] });


        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;