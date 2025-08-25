const mongoose = require('mongoose');
const {Schema} = mongoose;

const chatmodel = mongoose.Schema({
    chatId :{type : Schema.Types.ObjectId , required :true , ref :"chatMod"},
    sender :{type :String , required : true},
    text  : {type : String},
    image : {
        url : String,
        publicId : String
    },
    messageType : {
        type : String,
        enum : ["text" , "image"],
        default:"text"
    },
    seen : {
        type :Boolean,
        default : false
    },
    seenAt: {type : Date , default : null}

} , {timestamps : true})

const messagemod = mongoose.model('messagemod' , chatmodel)
module.exports = messagemod;