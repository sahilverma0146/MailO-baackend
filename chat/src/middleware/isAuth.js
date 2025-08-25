const  express = require('express');

// IMPORTS
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

const isAuth = async(req, res , next) =>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader){
            res.status(401).json({message:"PLEASE LOGIN - NO AUTH HEADER"});
            return;
        }

        const token = authHeader.split(" ")[1];

        const decodedValue = jwt.verify(token , process.env.JWT_SECRET.toString());
        if(!decodedValue || !decodedValue.user){
            res.status(401).json({message:"INVALID TOKEN"});
            return;
        }

        req.user = decodedValue.user;
        next();
    }catch(error){
        res.status(401).json({message:"PLEASE LOGIN -- JWT ERROR"})
    }

}

module.exports = isAuth;