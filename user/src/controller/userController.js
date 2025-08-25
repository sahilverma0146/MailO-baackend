const express = require("express");

const { publishToQueue } = require("../config/rabbitmq");

// IMPORTS
const userMod = require("../models/UserModel");
const generateToken = require("../config/generateToken");
const isAuth = require("../middleware/auth");

const login = async (req, res) => {
  const redisClient = require("../index");

  try {
    const { email } = req.body;

    // rate limit key
    const rateLimitKey = `otp:ratelimit:${email}`;

    const rateLimit = await redisClient.get(rateLimitKey);
    if (rateLimit) {
      res.status(429).json({ message: "too many request. please wait" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`;

    // SETS THE REAL OTP FOR FURTHER USE
    await redisClient.set(otpKey, otp, {
      EX: 300,
    });

    // FOR PREVENT SPAMMING
    await redisClient.set(rateLimitKey, "true", {
      EX: 60,
    });

    const message = {
      to: email,
      subject: "YOUR OTP IS",
      body: `YPUR OTP IS ${otp} . IT IS VALID FOR 5 MINUTES`,
    };

    await publishToQueue("send-otp", message);
    res.status(200).json({ message: "OTP SEND TO YOUR MAIL" });
  } catch (error) {
    res.status(404).json("something went wrong");
  }
};

const verifyUser = async (req, res) => {
  const { email, enteredOtp } = req.body;
  if (!email || !enteredOtp) {
    res.status(400).json({ message: "EMAIL AND OTP REQUIRED", success: false });
    return;
  }

  const otpKey = `otp:${email}`; // ON THIS KEY MY OTP SAVED *** BY THIS I HAVE GOT MY OTP
  const storedOtp = await redisClient.get(otpKey);
  if (!storedOtp || storedOtp !== enteredOtp) {
    res.status(400).json({ message: "INVALID OR EXPIRED OTP" });
    return;
  }

  // WHAT TO DO WHEN WE HAVE OTP
  await redisClient.del(otpKey);
  let user = await userMod.findOne({ email: email }); // we have to provide a object here
  if (!user) {
    const name = email.slice(0, 6);
    user = await userMod.create({ name, email });
  }

  const token = generateToken(user);
  res.status(200).json({ message: "USER VERIIFIED", user, token });
};

const profile = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ success: false });
  }
};

const updateName = async (req, res) => {
  try {
    const user = await userMod.findById(req.user?._id);
    if (!user) {
      res.status(401).json({ message: "PLEASE LOGGIN" });
      return;
    }
    console.log(user, " 🏳‍🌈🏳‍🌈🏳‍🌈🏳‍🌈❤❤❤❤");

    const name = req.body.userName;
    if(!name){
        console.log("NO BODY FOUND")
        return;
    }
    user.name = name;

    await user.save();

    const token = generateToken(user);

    res
      .status(200)
      .json({ message: "USER NAME UPDATED SUCCESSFULLY", FetchUser : { user}, token });
  } catch (error) {
    res.status(404).json({ message: "FAILED TO UPDATE NAME" });
  }
};

const getAllUsers = async (req, res) => {
  const user = await userMod.find();
  if (!user) {
    res.status(404).json({ message: "PLEASE LOGIN" });
    return;
  }
  res.status(200).json({ message: "ALL USERS FETCHED SUCCESSFULLY", user });
};

const getUsers = async (req, res) => {
  // GETTING THE USER ID FROM THE URL
  const user = await userMod.findById(req.params.id);
  res.status(200).json({ message: "USERS FETCHED SUCCESSFULLY", user });
};

module.exports = {
  login,
  verifyUser,
  profile,
  updateName,
  getAllUsers,
  getUsers,
};
