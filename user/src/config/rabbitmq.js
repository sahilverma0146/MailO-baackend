const amqp = require('amqplib');


let channel;

const connectRabbitMQ = async () =>{
    try {
        // CRETE A AMQP CONNECT
        const connection = await amqp.connect({
            protocol:"amqp",
            hostname : process.env.RABBITMQ_HOST_NAME,
            port : 5672, //RABBITMQ RUNNING ON THIS PORT
            username : process.env.RABBITMQ_USERNAME,
            password : process.env.RABBITMQ_USER_PASSWORD
        })

        // CREATE A CHANNEL ON THAT CONNECTION 
        channel = await connection.createChannel();
        console.log("👳‍♂️ RABBITMQ SUCCESSFULLY CONNECTED ");

        // WHAT I HAVE TO CREATE HERE BUT NOT

        // CREATE A EXCHANGE
        // const exchange = "mail_exchange"

        // CREETE A ROUTING KEY --> THAT HELPS THE EXCHANGE TO FIND ON WHCIH QUEUE THE DATA IS GOING TO PLACED
        // const routingKey = exchangeKey

        // /APPENDING THE EXCHANGE TO CHANNEL
        // await channel.assertExchange(excahnge , "direct" , {durable:false})

        // BINDING THE QUEUE WITH THE EXCHANGE
        // await channel.assertQueue("mail_queue" , {durable:true})

        // FINALLY CLSOE THE CONNECTION WE CREATED EARLIER
    } catch (error) {
        console.log("FAILED TO CONNECT TO RABBITMQ" , error)
    }
}


const  publishToQueue = async (queueName  , message)=>{
    if(!channel){
        console.log("FAILED TO INITIALIZE THE RABBITMQ CHANNEL")
        return;
    }

    //BINDS THE QUEUE WITH THE EXCHANGE *** DURABLE HELP IN PERSESTANT TTHE QUEUE
    await channel.assertQueue(queueName , {durable  :true});

    // SEND THE MSG TO THAT QUEUE *** BUFFER HELP IN PERSISTANT THE MSG
    channel.sendToQueue(queueName , Buffer.from(JSON.stringify(message) , {persistent : true}))
}
module.exports = {connectRabbitMQ , publishToQueue};