const router = require("express").Router();
const Chat = require("../models/Chat");


router.get("/", (req, res) => {
  res.send('welcome to chat page')
});


module.exports = router;