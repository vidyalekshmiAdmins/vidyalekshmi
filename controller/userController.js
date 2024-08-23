const mongoose = require("mongoose");
const User = require("../model/userModel");
const Otp = require("../model/otpModel")
const College = require('../model/collegeModel');
const Department = require('../model/departmentModel');
const Subject = require('../model/subjectModel');
const admissionApplication = require('../model/admissionApplication');
const express = require('express');
const user_route = express.Router();
const bcrypt = require("bcrypt");
const otpGenerator = require('otp-generator')
const twilio = require('twilio')
const accountSid = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const twilioClient = new twilio(accountSid,authToken)










//for login

const loadLogin = async (req, res) => {
  try {
    res.render('./user/pages/userLogin', { error: '' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const verifyLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({ $or: [{ email: identifier }, { mobileNumber: identifier }] }).select('+password');
    
    if (!user) {
      return res.render('./user/pages/userLogin', { error: 'Invalid identifier or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('./user/pages/userLogin', { error: 'Invalid password' });
    }
    

    req.session.user = user;

    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};





//for home page 

const loadHome = async(req,res)=>{
  try {
    res.render('./user/pages/home')
    console.log(req.session,"ithil");
  } catch (error) {
    throw new Error(error);
  }
}









//for user registration
const loadUserRegistration = async (req, res) => {
  try {
    const User = req.session.user;

    if (User) {
      res.redirect('/');
    } else {
      res.render("user/pages/userRegistration",{ userCheck: " "});
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};





const userSignUP = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, mobileNumber } = req.body;

    // Validate user input
    const errors = [];
    if (!username || username.trim() === '') {
      errors.push('Username is required');
    }
    if (!validator.isEmail(email)) {
      errors.push('Invalid email format');
    }
    if (!password || password.trim() === '') {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (password   
 !== confirmPassword) {
      errors.push('Password and confirm password do not match');
    }
    if (!validator.isMobilePhone(mobileNumber, 'any')) {
      errors.push('Invalid mobile number format');
    }

    if (errors.length > 0) {
      return res.render('./user/pages/userRegistration', { errors });
    }


    // Check for existing user
    const checkData = await User.findOne({ email });
    if (checkData) {
      return res.render('./user/pages/userRegistration', { userCheck: "User already exists, please try with a new email",errors  });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10); // Generate salt with a cost factor of 10
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      username,
      email,
      password: hashedPassword,
      mobileNumber,
    };

    const newUser = new User(userData);

    await newUser.save();
    console.log(newUser);

    // Success message or redirect to confirmation page
res.redirect('/');
    // res.redirect('/verify');
  } catch (error) {
    console.error(error);
    let errorMessage = 'Internal Server Error';
    if (error.name === 'MongoError' && error.code === 11000) { // Duplicate key error
      errorMessage = 'Email or mobile number already exists.';
    }
    res.status(500).send(errorMessage);
  }
};





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





//for loading the admission page which shows all the departments
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




//for loading colleges of a particular dept
const loadDeptAdmissions = async (req, res) => {
  try {
    const departmentId = req.params.deptId; 

    // Set the deptId in the session
    req.session.deptId = departmentId;

    // Fetch the department using departmentId
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).send('Department not found');
    }

    // Find colleges that have courses in this department
    const colleges = await College.find({ "courses.deptId": departmentId });
    
    res.render("./user/pages/deptAdmissions", {
      colleges,
      department, // Pass the whole department object
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

  






const loadCollegeApplication = async (req, res) => {
  try {
    const collegeId = req.params.collegeId;
    const deptId = req.session.deptId
  
    // Fetch the college by its ID
    const college = await College.findById(collegeId);
  
    if (!college) {
      return res.status(404).send('College not found');
    }
  
    // Filter the courses by the specific department
    const department = college.courses.find(course => course.deptId.toString() === deptId);
  
    if (!department) {
      return res.status(404).send('Department not found');
    }
  
    // Render the view and pass the filtered department and its courses to the EJS template
    res.render('./user/pages/collegeApplication', {
      college,
      department // Passing the specific department
    });
  
  } catch (error) {
    console.error('Error loading college application page:', error);
    res.status(500).send('Internal Server Error');
  }
};

  
    


// for loading individual application
const loadApplicationForm = async (req, res) => {
    try {
        const collegeId = req.params.collegeId;
        const deptId = req.session.deptId


        // Fetch the specific college based on collegeId
        const college = await College.findById(collegeId);

        const department = college.courses.find(course => course.deptId.equals(deptId));

        if (!department) {
            return res.status(404).send('Department not found');
        }

        res.render('./user/pages/admissionApplication', {
            college,
            department
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};



// FOR SUBMITTING THE APPLICATION FOR TAKING ADMISSION
const submitApplication = async (req, res) => {
  try {
    const { name, email, contact, course } = req.body;
    const userId = req.session.user._id;
    const collegeId = req.params.collegeId;
    const deptId = req.session.deptId;


      // Fetch the college
      const college = await College.findById(collegeId);
      if (!college) {
          return res.status(404).send('College not found');
      }

      // Fetch the department
      const department = college.courses.find(course => course.deptId.equals(deptId));
      if (!department) {
          return res.status(404).send('Department not found');
      }

      // Fetch the course (subject)
      const subject = department.subjects.find(sub => sub._id.equals(course));
      if (!subject) {
          return res.status(404).send('Course not found');
      }

      // Create a new admission application
      const newApplication = new admissionApplication({
          userId: userId,
          name,
          email,
          contactNumber: contact,
          course: subject._id,
          status: 'admission under process', // Default status
          collegeId: college._id,
          deptId: department.deptId,
      });

   // Save the application and get its ID
   const savedApplication = await newApplication.save();
   const applicationId = savedApplication._id;


   const user = await User.findById(userId);
   if (!user) {
     return res.status(404).send('User not found');
   }

   // Update the user's applications array
   user.applications.push(applicationId);

   // Save the updated user (important to persist the application ID)
   await user.save();

   res.redirect('/admissions'); 
  } catch (err) {
      console.error("Error submitting application:", err);
      res.status(500).send('Server Error');
  }
};




// for loading profile page
const profilePage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user)
    .populate({
      path: 'applications',
      populate: [
        {
          path: 'collegeId', // Populate the collegeId
          model: 'College',
          select: 'name',
        },
        {
          path: 'deptId', // Populate the deptId to get the department name
          model: 'Department',
          select: 'name',
        },
       
      ],
    });



    res.render('./user/pages/profilePage', { user, title: 'profilePage' });
  } catch (error) {
    throw new Error(error);
  }
};






const loadEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);


    res.render('./user/pages/editProfile', {   user ,title: 'editProfilePage' });
  } catch (error) {
    throw new Error(error);
  }
};



const editProfile = async (req, res) => {
  try {
    const { username, email, mobileNumber } = req.body;
    let profileImage;

    if (req.file) {
      profileImage = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.session.user,
      { username, email, mobileNumber, profileImage },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Could not log out, please try again.');
    }
    res.redirect('/');
  });
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
  loadDeptAdmissions,
  loadCollegeApplication,
  loadApplicationForm,
  submitApplication,
  profilePage,
  loadEditProfile,
  editProfile,
  logout}
