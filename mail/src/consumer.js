// HERE WE ARE NOT CREATING THE CHANNLE
const amqp = require("amqplib");

const nodemailer = require("nodemailer");

const dotenv = require("dotenv");
dotenv.config();

const startSendOtpConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST_NAME,
      port: 5672, //RABBITMQ RUNNING ON THIS PORT
      username: process.env.RABBITMQ_USERNAME,
      password: process.env.RABBITMQ_USE,
    });

    const channel = await connection.createChannel();

    const queueName = "send-otp";

    await channel.assertQueue(queueName, { durable: true });

    console.log("👩‍🦰 MAIL SERVER CONSUMER SERVER STARTED FOR OTP EMAILS ");
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          //PARSE--> CONVERT THE JSON STRING TO JAVASCRIPT OBJECT
          const { to, subject, body } = JSON.parse(msg.content.toString());

          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.AUTH_USER,
              pass: process.env.AUTH_PASSWORD,
            },
          });

          await transporter.sendMail({
            from: "chat-appp",
            to,
            subject,
            text: body,
          });
          console.log(`OTP MAIL SEND TO ${to}`);
          
          channel.ack(msg);
        } catch (error) {
          console.log(`   FAILED TO SEND OTP`);
        }
      }
    });
  } catch (error) {
    console.log("FAILED TO START RABBITMQ CONSUMER", error);
  }
};

module.exports = {startSendOtpConsumer}