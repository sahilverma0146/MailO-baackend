const mongoose = require('mongoose');

const ConnectDb = async () =>{
    const url = process.env.MONGO_URI;

    if(!url){
        throw new Error("MonOdB URL IS NOT FOUND");
    }

    try {
        await mongoose.connect(url , {
            dbName : "CHATAPPMICROSERVICE"
        });
        console.log("CONNECTED TO MONGODB")
    } catch (error) {
        console.log("FAILED TO CONNECT TO MONGOBD" , error);
        // THIS SHUT DOWN THE FUNCTION
        process.exit(1);
    }
}

module.exports = ConnectDb;
