const { Server, Socket } = require("socket.io");

const http = require("http");
const express = require("express");

const app = express();

// CREATES A NEW SERVER USING HTTP AND BIND IT WITH EXPRESS SERVER
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // USED TO TRACK ONLINE USERS

// RECEIVERID = THE OTHER USER ID
const getReceiverSocketId = (receiverId) =>{
  return userSocketMap[receiverId] // MAP LIKE "USER_ID" : "SOCKET_ID"
}



// HERE IO REFER TO THE *** SERVER ***
io.on("connection", (socket) => {
  console.log("USER CONNECTED", socket.id);

  // SEND FROM FRONTEND LIKE THIS
  //   const newSocket = io(chat_Service, {
  //     query: { userId: user._id },
  //   });

  // SAME AS QUERY ***FRONTEND SEND THE USERID AAND HERE THE SERVER --SOCKET-- GRAB IT
  const userId = socket.handshake.query?.userId;
  console.log(userId, " 😂😁😂😁😂😁😁");

  if (userId && userId !== undefined) {
    userSocketMap[userId] = socket.id;
    console.log(` USER ${userId} MAPPED TO SOCKET ${socket.id}`);
  }

  //   EMIT A EVENT IN WHICH THE ONLINE USERS ARE SEND
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  if (userId) {
    socket.join(userId);
  }

  socket.on("typing", (data) => {
    console.log(`USER ${data.userId} IS TYPING IN CHAT ${data.chatId}`);

    // NOW EXCEPT THE SENDER I WILL BROADCAST TO OTHER USERS
    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  // WHEN USER STOPS TYPING
  socket.on("stopTyping", (data) => {
    console.log(
      `USER WITH THIS ${data.userId} STOP TYPING IN CHAT ${data.chatId}`
    );

    // NOW BROADCAST
    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("joinChat" , (chatId)=>{
    socket.join(chatId);
    console.log(`USER ${userId} JOINED CHAT ROOM OF THIS CHATID ${chatId} `)
  })

  
  socket.on("leaveChat" , (chatId)=>{
    socket.leave(chatId);
    console.log(`USER ${userId} LEAVE THE  CHAT ROOM OF THIS CHATID ${chatId} `)
  })

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`USER WITH THIS ${userId} REMOVED FROM ONLINE USERS`);
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  socket.on("connect_error", (error) => {
    console.log("SOCKET CONNECTION ERROR", error);
  });
});

module.exports = { app, server, io , getReceiverSocketId };
