const router = require("express").Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const { verifyToken } = require('../middleware/authMiddleware');

// post chat
router.post("/", verifyToken, async (req, res) => {
  const { userId } = req.body;
  console.log(req.user.id);
  if (!userId) {
    console.log("userId params not sent with request.");
    return res.status(400).json("userId not provided");
  }
  try { 
    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user.id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ]
    }).populate("users", "-password").populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      select: "username profilePicture email"
    });
  
    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user.id, userId]
      }
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password")
      res.status(200).send(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// get chat for all users
router.get("/", verifyToken, async (req, res) => {

  try {
    await Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "username profilePicture email"
        });
        res.status(200).send(results);
      });

  } catch (error) {
    res.status(400).json(error);
  }

  // try {
  //   console.log(req.user.id);
  //   const chats = await Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
  //     .populate("users", "-password")
  //     .populate("groupAdmin", "-password")
  //     .populate("latestMessage")
  //     .sort({ updatedAt: -1 });

  //   const results = await User.populate(chats, {
  //     path: "latestMessage.sender",
  //     select: "username profilePicture email"
  //   });

  //   res.status(200).send(results);
  // } catch (error) {
  //   console.error(error);
  //   res.status(400).json({ error: 'Error fetching chats' });
  // }

});


// create group
router.post("/group", verifyToken, async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "please fill all the felids." })
  }
  var users = JSON.parse(req.body.users);
  if (users.length < 2) {
    return res.status(400).send("More then 2 users are required to form A group chat.")
  }
  users.push(req.user.id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id // Use req.user.id instead of req.user
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json(error);
  }

});


// rename group
router.put("/rename", verifyToken, async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId, {
    chatName,
  },
    {
      new: true,
    },
  ).populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
  } else {
    res.json(updatedChat);
  }
});


// add in group
router.put("/groupadd", verifyToken, async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true },
  ).populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
  } else {
    res.json(added);
  }
});


// remove group or leave group
router.put("/groupremove", async (req, res) => {
  const { chatId, userId } = req.body;

  const remove = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true },
  ).populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!remove) {
    res.status(404);
  } else {
    res.json(remove);
  }

});




module.exports = router;