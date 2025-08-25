const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config()

const Connect = async ()=>{
        const url = process.env.MONGO_URL;


    try {
        console.log(url)
        if(!url){
            resizeBy.status(404).json({message :"URL NOT FOUND"})
        }

        await mongoose.connect(url , {
            dbName : "Chatdb"
        });
        console.log(`CONNECTED TO MONGODB SUCCESSFULLY 👩‍🦰`)
    } catch (error) {
        console.log("GETTING ERROR IN CONNECTING TO THE DATABASE0 " , error)
    }

}
module.exports = Connect;