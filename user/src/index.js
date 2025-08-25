const express = require('express');
const app = express();

app.use(express.json());

// IMPORTS
const router = require('./routes/userRouter')
const {connectRabbitMQ} = require('./config/rabbitmq')


const cors = require('cors')
app.use(cors())

const connectDb = require('./config/db')

const dotenv = require('dotenv');
dotenv.config(); // THIS HELP TO READ THE .ENV VARIABLES

const {createClient} = require('redis')

// CONNECT TO MONGODB
connectDb()

// CONNECTION TO RABBITMQ
connectRabbitMQ()

// CONNECTION TO REDIS
module.exports = redisClient = createClient({
    url : process.env.REDIS_URL
})
redisClient.connect().then(()=>console.log("CONNECTED TO REDIS SUCCESSFULLY")).catch(console.error);




app.use('/api/v1' , router)


const port = process.env.port;
app.listen(port
    , () =>{
        console.log(`user server is running at ${port}`)
    }
)