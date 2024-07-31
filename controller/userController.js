const mongoose = require("mongoose");
const User = require("../model/userModel");
const Otp = require("../model/otpModel")
const College = require('../model/collegeModel');
const Department = require('../model/departmentModel');
const Subject = require('../model/subjectModel');
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
    const identifier = req.body.identifier;
    const password = req.body.password;

    if (!identifier || !password) {
      res.render("./user/pages/userLogin", { userCheck: "Please enter both identifier and password" });
    } 

    const isEmail = identifier.includes('@')
    let userData
    
    if(isEmail){
      userData = await User.findOne({ email: identifier })
    }else{
      userData = await User.findOne({ mobileNumber: identifier })
    }

    if (userData) {
      if (password === userData.password) {
        req.session.user_id = userData._id;
        console.log(userData._id);
        res.status(302).redirect("/");
      } else {
        res.render("./user/pages/userLogin", { userCheck: "Identifier and Password is incorrect" });
      }
    } else {
      res.render("./user/pages/userLogin", { userCheck: "Identifier and Password is incorrect" });
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
    res.render("user/pages/userRegistration", { userCheck: " " });
  } catch (error) {
    // Log the error or send an error response to the client
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};







const userSignUP = async (req, res) => {
  try {
    const emailCheck = req.body.email;
    const checkData = await User.findOne({ email: emailCheck });
    if (checkData) {
  
      return res.render('./user/pages/userRegistration', { userCheck: "User already exists, please try with a new email" });
    } else {
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
      mobileNumber: req.body.mobileNumber,
      };

      const confirmPassword = req.body.confirmPassword;

      if (userData.password !== confirmPassword) {
        return res.render('./user/pages/userRegistration', { userCheck: " ", passwordMatchError: "Password and confirm password do not match" });
      }
      
  const newUser = new User(userData);

    await newUser.save();
    console.log(newUser);
    req.session.mobileNumber = req.body.mobileNumber
    res.redirect('/verify')
    }
  } catch (error) {
    throw new Error(error);
  }
}




const sendOtp = async(req,res)=>{
  try {
    const mobileNumber  =  req.session.mobileNumber
    const otp = otpGenerator.generate(6, { upperCaseAlphabets : false , specialChars : false , lowerCaseAlphabets : false})
    const cDate = new Date()
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp , otpExpiration : new Date(cDate.getTime()) },
      { upsert : true , new : true , setDefaultsOnInsert :true }
    )

      await twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        to : ` +91 ${mobileNumber}`,
        from : process.env.FROM_NUMBER
      })

    res.render("./user/pages/verify", {userCheck:" "});

  } catch (error) {
    throw new Error(error);
  }
}



const verifyOtp = async(req,res) =>{
  try {
    const otp = req.body.otp
    const mobileNumber = req.session.mobileNumber
    const otpRecord = await Otp.findOne({mobileNumber})
    if(!otpRecord){
      return res.render('./user/pages/verify',{userCheck : 'OTP verification failed. Please try again.',resend : true})
    }

    const storedOtp = otpRecord.otp
    console.log(otp,storedOtp);
    const OTP_VALIDITY_DURATION = 1 * 60 * 1000;
    const otpExpiration = otpRecord.otpExpiration + OTP_VALIDITY_DURATION
    const otpExpirationDate = new Date(otpExpiration)
    const currentTime = new Date()
    console.log(currentTime,otpExpirationDate);
    if(currentTime > otpExpirationDate){
      return res.render('./user/pages/verify',{ userCheck : 'OTP has expired. Please request a new OTP.',resend : true })
    }
    if(otp === storedOtp){
      res.redirect('/')
    }else{
      res.render("./user/pages/verify", { userCheck: "Incorrect OTP. Please try again.", resend: true })
    }
  } catch (error) {
    throw new Error(error)
  }
}



//for user registration
const loadUniversityServices = async (req, res) => {
  try {
    const User = req.session.user;
    res.render("user/pages/universityServices", { userCheck: " " });
  } catch (error) {
    // Log the error or send an error response to the client
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


  const loadAdmissions = async (req, res) => {
    try {
      const colleges = await College.find({});
      const departments = await Department.find({});
      const subjects = await Subject.find({});

      res.render("./user/pages/admissions", {
        colleges,
        departments,
        subjects,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };


  


  const loadDeptAdmissions = async (req, res) => {
    try {
      const { deptId } = req.params;
  
      // Find the college with the specified department
      const college = await College.findOne({ 'courses.deptId': deptId });
  
      if (!college) {
        return res.status(404).send('College not found');
      }
  
      // Extract department details
      const department = college.courses.find(course => course.deptId.equals(deptId));
  
      res.render('./user/pages/deptAdmissions', {
        college,
        department,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  };
  



module.exports ={
  loadUserRegistration,
  userSignUP,
  loadLogin,
  verifyLogin,
  loadHome,
  sendOtp,
  verifyOtp,
  loadUniversityServices,
  loadAdmissions,
  loadDeptAdmissions}
