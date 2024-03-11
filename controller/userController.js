const mongoose = require("mongoose");
const User = require("../model/userModel");
const express = require('express');
const user_route = express.Router();
const bcrypt = require("bcrypt");
// const asyncHandler = require("express-async-handler");
// const { sendOtp } = require("../utility/nodeMailer");
// const { generateOTP } = require("../utility/nodeMailer");







//for user registration

const loadUserRegistration = async (req, res) => {
  try {
    const User = req.session.user;

    res.render("./user/pages/userRegistration",{ userCheck: " " });
  } catch (error) {
    throw new Error(error);
  }
};


//for user signup
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

     // const OTP = generateOTP(); /* otp generating */

      // req.session.otpUser = { ...userData, otp: OTP };

      // console.log(req.session.otpUser);

      // /** otp sending ***/
      // try {
      //   sendOtp(req.body.email, OTP, req.body.username);
      //   req.app.locals.otpUser = { otpUser: { ...User, otp: OTP }};
      //   return res.redirect('/otp' );
      // } catch (error) {
      //   console.error('Error sending OTP:', error);
      //   return res.status(500).send('Error sending OTP');
      // }
    }
  } catch (error) {
    throw new Error(error);
  }
}


//user login
const loadSignin = async (req, res) => {
  try {
    res.render("./user/pages/userLogin",{ userCheck: " " });
  } catch (error) {
    throw new Error(error);
  }
};


const verifySignin = async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber;
    const password = req.body.password;
    const userData = await User.findOne({ mobileNumber: mobileNumber });

    if (!mobileNumber || !password) {
      res.render("./user/pages/userLogin", { userCheck: "Please enter both Mobile Number and Password" });
    } else if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (userData.is_admin == 0) {
        req.session.user_id = userData._id;
        res.status(302).redirect("/home");
      } else {
        res.render("./user/pages/userLogin", { userCheck: "Mobile Number and Password is incorrect" });
      }
    } else {
      res.render("./user/pages/userLogin", { userCheck: "Mobile Number and Password is incorrect" });
    }
  } catch (error) {
    throw new Error(error);
  }
};


module.exports ={ 
  loadUserRegistration,
  userSignUP,
  loadSignin,
  verifySignin
}