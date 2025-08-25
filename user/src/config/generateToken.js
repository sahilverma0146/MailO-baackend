const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user)=>{
    return jwt.sign( {user} , JWT_SECRET.toString() , {expiresIn: "15d"})

}

module.exports = generateToken;