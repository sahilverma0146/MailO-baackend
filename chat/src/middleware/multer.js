const multer = require('multer');

// IMPORTS
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');


// ***FIRST CRETE THE STORAGE
const storage = new CloudinaryStorage({
    cloudinary : cloudinary,
    params : {
        folder : "chat-images",
        allowed_formats :["jpg" , "jpeg" , "png" , "wpeg"],
        transformations : [{ width:800 , heigth :600 , crop:"limit"} ,  {quality:"auto"}],
    }
});

// DEFINE MULTER --> *** HELP US TO SEND THE FILE IN THE BODY
const upload = multer({
    storage,
    limits  :{
        fileSize : 5 * 1024 * 1024 // 5MB LIMITS
    },
    fileFilter : ( req , file , cb)=>{
        if(file.mimetype.startsWith("image")){
            cb(null , true)
        }else{
            cb(new Error("ONLY IMAGES ARE ALLOWED"))
        }
    }
});


module.exports = upload;