const express = require('express');
const router = express.Router();

// IMPRTS 
const {createNewChat , getAllChat , sendMessage , fetchMessages} = require('../controller/chatcontroller')
const isAuth = require('../middleware/isAuth')

const upload = require('../middleware/multer')




// routes
router.post('/createchat' ,isAuth , createNewChat)
router.get('/chat/all' , isAuth , getAllChat);
router.post('/message' , isAuth , upload.single('image') , sendMessage)
router.get('/message/:chatId' , isAuth , fetchMessages)

module.exports = router;