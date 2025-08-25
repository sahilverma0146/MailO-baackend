const {app , server} = require('./config/socket')

const express =  require('express');
// const app = express();
const cors = require('cors');

app.use(cors())
app.use(express.json());


//IMORTS
const dotenv = require('dotenv').config();
const router = require('./routes/chatRoutes')
const  Connect = require('./config/Db') 


app.use('/api/v1' , router)

Connect();

const port = process.env.PORT
server.listen(port , ()=>{
    console.log(`app listen on port ${port}`)
})