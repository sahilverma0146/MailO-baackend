const express = require("express");

//  IMPORTS
const chatMod = require("../models/chatModel");
const messagemod = require("../models/messagemodel");

const { getReceiverSocketId, io } = require("../config/socket");

const createNewChat = async (req, res) => {
  const userId = req.user?._id;

  // OHTER USER ID--> WHICH WE WANT TO CHAT
  const { otherUserId } = req.body;
  if (!otherUserId) {
    resizeBy.status(404).json({ message: "OTHER USERID IS REEQUIRED" });
    return;
  }

  const existingChat = await chatMod.findOne({
    users: { $all: [userId, otherUserId], $size: 2 },
  });

  // IF CAHTS EXISTS
  if (existingChat) {
    res
      .status(200)
      .json({ message: "CHAT ALREADY EXIST", chatId: existingChat._id });
    return;
  }

  // create NWE CHAT
  const NewChatId = await chatMod.create({
    users: [userId, otherUserId],
  });

  res.status(201).json({ message: "NEW CHAT CREATED", chatId: NewChatId._id });
};

const getAllChat = async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(404).json({ message: "USERID IS MISSING" });
  }

  try {
    // Find all chats where user is a participant
    const chats = await chatMod.find({ users: userId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find(
          (id) => id.toString() !== userId.toString()
        );

        // Count unseen messages
        const unSeenCount = await messagemod.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          isSeen: false,
        });

        // i have this route in my USER MICROSERVICE
        try {
          const response = await fetch(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await response.json();

          return {
            user: data.user,
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unSeenCount,
            },
          };
        } catch (error) {
          console.log("Error fetching user:", error);

          return {
            user: { _id: otherUserId, name: "Unknown User" },
            chat: {
              ...chat.toObject(),
              latestMessage: chat.latestMessage || null,
              unSeenCount,
            },
          };
        }
      })
    );

    res.status(200).json({ chats: chatWithUserData });
  } catch (err) {
    console.error("Error getting chats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id; //LOGGEDIN USER

    const { chatId, text } = req.body;
    const imageFile = req.file;

    if (!senderId) {
      res.status(404).json({ message: "UNAUTHORIZED" });
      return;
    }
    if (!chatId) {
      res.status(404).json({ message: "CHATID REQUIRED" });
      return;
    }

    if (!text) {
      res.status(404).json({ message: "EITHER TEXT OR IMAGE IS REQUIRED" });
      return;
    }

    // FIND OUT THE CHAT
    const chat = await chatMod.findById(chatId);
    if (!chat) {
      res.status(404).json({ message: "CHAT NOT FOUND" });
    }

    // *** SOME METHOD IN JS --> THAT CHECKS  THAT ANOTHER USER PRESENT THE USERS ARRAY(CHAT MODEL)
    const isUserInChat = chat.users.some(
      // THIS GIVES BOOL VALUE
      (userId) => userId.toString() === senderId.toString()
    );

    if (!isUserInChat) {
      res
        .status(403)
        .json({ message: "YOU ARE NOT A PARTICIPANT OF THIS CHAT" });
      return;
    }

    // FIND THAT OTHER  USER ID
    const otherUserId = chat.users.find(
      (userId) => userId.toString() !== senderId.toString()
    );
    if (!otherUserId) {
      res.status(404).json({ message: "NO OTHER USER" });
      return;
    }

    // SOCKET CREATE --> CRETING THE CONNECTION TO FUTHER EMIT THE MSG

    // CHECK RECEIVER IS ONLINE OR NOT
    const receiverSocketId = getReceiverSocketId(otherUserId.toString()); // CHEXKS THE OTHER USER IS ONLINE / OFFLINE
    let isReceiverIsInChatRoom = false;

    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if (receiverSocket && receiverSocket.rooms.has(chatId)) {
        isReceiverIsInChatRoom = true;
      }
    }

    let messageData = {
      chatId: chatId,
      sender: senderId,
      seen: isReceiverIsInChatRoom,
      seenAt: isReceiverIsInChatRoom ? new Date() : undefined,
    };

    if (imageFile) {
      messageData.image = {
        url: imageFile.path,
        publicId: imageFile.fileName,
      };
      messageData.messageType = "image";
      messageData.text = text || ""; // IF ANY USER SENDS THE TEXT ALONG WITH IMAGE THIS JUST CREEATA TEXT IN THE MESSAGEoBJECT
    } else {
      messageData.text = text;
      messageData.messageType = "text";
    }

    const message = new messagemod(messageData);
    const savedMessage = await message.save();

    const latestMessageText = imageFile ? "📷" : text;

    await chatMod.findByIdAndUpdate(
      chatId,
      {
        latestMessage: {
          text: latestMessageText,
          sender: senderId,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    // EMIT THE MSG TO THE ROOM
    io.to(chatId).emit("newMessage", savedMessage); //SAVEDMESSAGE --> OLD MESSAGES  ***  IN THIS SAVEDMESSAGES -- > THE OLD MESSAGES ANF THE NEW MESSAGE WE SENT IS ALSO THERE

    // EMIT MSG TO A SNGLE RECEIVER
    if (receiverSocketId) { // OTHER USER SOCKET ID
      io.to(receiverSocketId).emit("newMessage", savedMessage); 
    }

    const senderSocketId = getReceiverSocketId(senderId.toString()); //FIND SENDER SOCKET ID **** //THE USER WHO SENT MESSAGE SOCKET ID GET HERE
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", savedMessage);
    }

    if (isReceiverIsInChatRoom && senderSocketId) {
      io.to(senderSocketId).emit("messagesSeen", {
        chatId: chatId,
        seenBy: otherUserId,
        messageId: savedMessage._id,
      });
    }

    res.status(201).json({ message: savedMessage, sender: senderId });
  } catch (error) {
    console.log(`GETTING ERROR IN SESNDING THE MESSAGAE`, error);
  }
};

const fetchMessages = async (req, res) => {
  const userId = req.user?._id;

  const chatId = req.params.chatId;
  console.log(chatId);

  if (!userId) {
    res.status(404).json({ message: "UNAUTHORIZED" });
    return;
  }
  if (!chatId) {
    res.status(404).json({ message: "CHATID REQUIRED" });
    return;
  }

  const chat = await chatMod.findById(chatId);

  if (!chat) {
    res.status(404).json({ message: "CHAT NOT FOUND" });
    return;
  }

  // convert to strings --> MongoDB ObjectId instances are objects AND WE CAONT COMPARE 2 OBJECTS
  // CHECKS THE OTHER USER IS PRESENT IN THE CHAT OR NOT
  const isUserInChat = chat.users.some(
    (otherUserId) => otherUserId.toString() === userId.toString()
  );

  const messagesToMarkToSeen = await messagemod.find({
    chatId: chatId,
    sender: { $ne: userId },
    seen: false,
  });
  await messagemod.updateMany(
    { chatId: chatId, sender: { $ne: userId }, seen: true },
    { seen: true, seenAt: new Date() }
  );

  const messages = await messagemod.find({ chatId }).sort({ createdAt: 1 });

  const otherUserId = await chat.users.find(
    (id) => id.toString() !== userId.toString()
  );

  try {
    if (!otherUserId) {
      res.status(404).json({ message: "NO OTHER USER" });
      return;
    }
    const response = await fetch(
      `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();

    // SOCKET WORK

    // UNSEEN MSG > 0
    if (messagesToMarkToSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId.toString()); // THE OTHERuSER SOCKETiD
        if(otherUserSocketId){
            io.to(otherUserSocketId).emit("messagesSeen" ,{
                chatId : chatId,
                seenBy : userId,
                messageIds : messagesToMarkToSeen.map((msg)=>msg._id)
            } )
        }
    }

    res.status(200).json({ messages, user: data.user });
  } catch (error) {
    console.log(error);
    res.status(404).json({ messages, user: otherUserId, name: "unknown User" });
  }
};

module.exports = { createNewChat, getAllChat, sendMessage, fetchMessages };
