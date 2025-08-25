const mongoose = require('mongoose');
const {Schema} = mongoose;

const chatModel = mongoose.Schema({
    users: [{ type:String , required :true }],
    latestMessage : {
        text : String,
        sender : String
    }

} , { timestamps : true}
)

const chatMod = mongoose.model('chatMod' , chatModel);
module.exports = chatMod;