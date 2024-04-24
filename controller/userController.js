const mongoose = require("mongoose");
const User = require("../model/userModel");
const express = require('express');
const user_route = express.Router();
const bcrypt = require("bcrypt");
const otpGenerator = require('otp-generator')
const twilio = require('twilio')
const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const twilioClient = new twilio(accountSid,authToken)










//for login

const loadLogin = async(req,res)=>{
  try {
    res.render("./user/pages/userLogin", {userCheck:" "});
  } catch (error) {
    throw new Error(error);
  }
}

const verifyLogin = async(req,res)=>{
  try {
    const mobile = req.body.mobileNumber;
    console.log("mobile:",mobile);
    const password = req.body.password;
    const userData = await User.findOne({ mobileNumber: mobile });
    console.log("userData",userData);
    if (!mobile || !password) {
      res.render("./user/pages/userLogin", { userCheck: "Please enter both mobile and password" });
    } else if (userData) {
      // const passwordMatch = await bcrypt.compare(password, userData.password);
      // console.log(passwordMatch);
      if (password === userData.password) {
        req.session.user_id = userData._id;
        console.log(userData._id);
        res.status(302).redirect("/");
      } else {
        res.render("./user/pages/userLogin", { userCheck: "Mobile and Password is incorrect" });
      }
    } else {
      res.render("./user/pages/userLogin", { userCheck: "Mobile and Password is incorrect" });
    }
  } catch (error) {
    throw new Error(error);
  }
}









//for home page 

const loadHome = async(req,res)=>{
  try {
    res.render('./user/pages/home')
  } catch (error) {
    throw new Error(error);
  }
}





//for user signup


//for user registration
const loadUserRegistration = async (req, res) => {
  try {
    const User = req.session.user;

    res.render("./user/pages/userRegistration",{ userCheck: " " });
  } catch (error) {
    throw new Error(error);
  }
};





const userSignUP = async (req, res) => {
  try {
    const emailCheck = req.body.email;
    const checkData = await User.findOne({ email: emailCheck });

    if (checkData) {
      return res.render('./user/pages/signup', { userCheck: "User already exists, please try with a new email" });
    } else {
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        mobileNumber: req.body.mobileNumber,
      };

      const confirmPassword = req.body.confirmPassword;

      // Check if the password and confirm password match
      if (userData.password !== confirmPassword) {
        return res.render('./user/pages/userRegistration', { userCheck: "", passwordMatchError: "Password and confirm password do not match" });
      }

      // Create a new User instance
      const newUser = new User(userData);

      // Save the user to the database
      await newUser.save();

      // Send OTP after user is saved (assuming mobileNumber is valid)
      await sendOtp(req.session.mobileNumber); // Call sendOtp function
      res.render("./user/pages/verify", { userCheck: " " }); // Assuming verification page
    }
  } catch (error) {
    throw new Error(error);
  }
};

const sendOtp = async (mobileNumber) => { // Assuming mobileNumber is provided
  try {
    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const cDate = new Date();
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp, otpExpiration: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await twilioClient.messages.create({
      body: `Your OTP is ${otp}`,
      to: `+91 ${mobileNumber}`,
      from: process.env.FROM_NUMBER
    });
  }catch (error) {
    throw new Error(error);
  }
};



module.exports ={ loadUserRegistration,
  userSignUP,
  loadLogin,
  verifyLogin,
  loadHome}
