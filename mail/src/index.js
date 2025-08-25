const express = require('express');
const app = express();

const dotenv = require('dotenv');
dotenv.config();


// imports
const {startSendOtpConsumer} = require('./consumer')

startSendOtpConsumer();



let port = process.env.PORT
app.listen(port , ()=>{
    console.log(`MAIL SERVICE IS RUNNONG ON ${port}`)
})