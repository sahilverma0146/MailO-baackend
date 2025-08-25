const express = require('express');

const router = express.Router();

// IMOPRTS
const {login  , verifyUser , profile, getUsers , getAllUsers, updateName} = require('../controller/userController')
const isAuth = require('../middleware/auth')

router.post('/login' , login);
router.post('/verifyUser', verifyUser);
router.get('/profile' , isAuth ,  profile);
router.post('/update/user' , isAuth , updateName);
router.get('/allusers', isAuth , getAllUsers);
router.get('/user/:id' , getUsers);



module.exports = router;