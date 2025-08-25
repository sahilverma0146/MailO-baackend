const mongoose = require('mongoose');
const {Schema} = mongoose;

const userModel = mongoose.Schema({
    name : {type : String , required : true},
    email :{type : String , required : true , unique : true}
} , {timestamps : true});

// COMMON.JS SINGLE EXPORT
const userMod = mongoose.model("userModel" , userModel);
module.exports = userMod;