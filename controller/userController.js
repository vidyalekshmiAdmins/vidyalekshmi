const mongoose = require("mongoose");
const User = require("../model/userModel");
const Otp = require("../model/otpModel");
const College = require("../model/collegeModel");
const Department = require("../model/departmentModel");
const Subject = require("../model/subjectModel");
const admissionApplication = require("../model/admissionApplication");
const express = require("express");
const user_route = express.Router();
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const twilio = require("twilio");
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const validator = require("validator");
const { check } = require("express-validator");
const twilioClient = new twilio(accountSid, authToken);



const loadLogin = async (req, res) => {
  try {
    res.render("./user/pages/userLogin", { error: "" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const verifyLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or : [{email: identifier},{mobileNumber: identifier}] }).select(
      "+password"
    );
    if (!user) {
      return res.render("./user/pages/userLogin", {
        error: "Invalid identifier or password",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("./user/pages/userLogin", {
        error: "Invalid password",
      });
    }
    req.session.user = user;
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const loadHome = async (req, res) => {
  try {
    const { user } = req.session;
    const topColleges = await College.find()
      .sort({ "admissions.length": -1 })
      .limit(10)
      .select("name district state establishedIn images");
    res.render("./user/pages/home", { user, topColleges });
  } catch (error) {
    console.error("Error loading home page:", error);
    res.status(500).send("Server Error");
  }
};



const loadUserRegistration = async (req, res) => {
  try {
    const User = req.session.user;
    const errors = [];
    if (User) {
      res.redirect("/");
    } else {
      res.render("user/pages/userRegistration", { userCheck: " ", errors });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const userSignUP = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, mobileNumber } = req.body;
    console.log('req.body:', req.body);

    const errors = [];
    if (!username || !email || !password || !confirmPassword || !mobileNumber) {
      errors.push("All fields are required");
    }
    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }
    if (errors.length > 0) {
      return res.render("./user/pages/userRegistration", { errors });
    }

    const checkData = await User.findOne({ $or: [{ email }, { mobileNumber }] });
    console.log('checkData: ',checkData);
    
    if (checkData) {
      return res.render("./user/pages/userRegistration", {
        userCheck: "User already exists, please try with a different email or mobile number.",
        errors,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      mobileNumber,
    });

    await newUser.save();

    req.session.user = newUser;
    req.session.mobileNumber = mobileNumber;
    console.log(req.session.user._id, "Redirecting...");

    res.redirect("/verify");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const sendOtp = async (req, res) => {
  try {
    const mobileNumber = req.session.mobileNumber;
    console.log(mobileNumber);
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });
    const cDate = new Date();
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp, otpExpiration: new Date(cDate.getTime()) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await twilioClient.messages.create({
      body: `Your OTP is ${otp}`,
      to: ` +91 ${mobileNumber}`,
      from: process.env.FROM_NUMBER,
    });
    res.render("./user/pages/verify", { userCheck: " " });
  } catch (error) {
    console.error("Error:",error)
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { otp1, otp2, otp3, otp4, otp5, otp6, action } = req.body;
    const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`; // Combine OTP parts into a single string
    const mobileNumber = req.session.mobileNumber; // Mobile number from session

    const otpRecord = await Otp.findOne({ mobileNumber });

    if (!otpRecord) {
      return res.render("./user/pages/verify", {
        userCheck: "OTP verification failed. Please try again.",
        resend: true,
      });
    }

    const isExpired = new Date() > new Date(otpRecord.otpExpiration).getTime();
    if (isExpired) {
      return res.render("./user/pages/verify", {
        userCheck: "OTP has expired. Please request a new OTP.",
        resend: true,
      });
    }

    if (otp === otpRecord.otp) {
      if (action === "forgotPassword") {
        res.render("./user/pages/resetPassword", { userCheck: "OTP verified. You can reset your password now." });
      } else {
        res.redirect("/"); 
      }
    } else {
      res.render("./user/pages/verify", { userCheck: "Incorrect OTP. Please try again." });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.render("./user/pages/verify", { userCheck: "OTP verification failed. Please try again later." });
  }
};


const resendOtp = async (req, res) => {
  try {
    const mobileNumber = req.session.mobileNumber;
    if (!mobileNumber) {
      return res.redirect('/login');
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    const otpValidityDuration = parseInt(process.env.OTP_VALIDITY_DURATION, 10);
    if (isNaN(otpValidityDuration)) {
      console.error("Invalid OTP validity duration");
      return res.status(500).send("Configuration error. Please try again later.");
    }

    const otpExpiration = new Date(Date.now() + otpValidityDuration * 1000); 
    await Otp.findOneAndUpdate(
      { mobileNumber },
      { otp, otpExpiration },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await twilioClient.messages.create({
      body: `Your new OTP is ${otp}`,
      to: `+91${mobileNumber}`,
      from: process.env.FROM_NUMBER,
    });
    res.render("./user/pages/verify", { userCheck: "A new OTP has been sent to your registered number." });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.render("./user/pages/verify", { userCheck: "Failed to resend OTP. Please try again later." });
  }
};



const loadUniversityServices = async (req, res) => {
  try {
    const User = req.session.user;
    res.render("user/pages/universityServices", { userCheck: " " });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const loadAdmissions = async (req, res) => {
  try {
    const { user_id } = req.session
    const colleges = await College.find({});
    const departments = await Department.find({});
    const subjects = await Subject.find({});
    const states = await College.distinct("state");
    const types = await College.distinct("type"); 
    const categories = await College.distinct("category");
    const graduationTypes = await Subject.distinct("GraduationType"); 
    const selectedFilters = {
      group: "all",
      state: "all",
      type: "all",
      category: "all",
      graduationType: "all",
    };
    res.render("./user/pages/admissions", {
      user_id,
      colleges,
      departments,
      subjects,
      states,
      types, 
      categories, 
      graduationTypes, 
      courses: [], 
      selectedFilters, 
    });
    
  } catch (error) {
    console.error("Error loading admissions page:", error);
    res.status(500).send("Server error");
  }
};



const filterAdmissions = async (req, res) => {
  try {
    const { group, state, type, category, graduationType } = req.body;
    let filterCriteria = {};
    if (state && state !== "all") {
      filterCriteria["state"] = state;
    }
    if (type && type !== "all") {
      filterCriteria["type"] = type;
    }
    if (category && category !== "all") {
      filterCriteria["category"] = category;
    }
    let colleges = await College.find(filterCriteria)
      .populate({
        path: "courses.deptId",
        match:
          group && group !== "all"
            ? { _id: new mongoose.Types.ObjectId(group) }
            : {},
        select: "name", 
      })
      .populate({
        path: "courses.subjects.subjectId",
        match:
          graduationType && graduationType !== "all"
            ? { GraduationType: graduationType }
            : {},
        select: "name GraduationType", 
      });
    console.log("Filtered colleges after population:", colleges);
    const filteredSubjects = [];
    colleges.forEach((college) => {
      college.courses.forEach((course) => {
        const isGroupMatch =
          group === "all" ||
          (course.deptId && course.deptId._id
            ? new mongoose.Types.ObjectId(group).equals(course.deptId._id)
            : new mongoose.Types.ObjectId(group).equals(course.deptId)); 
        if (isGroupMatch) {
          course.subjects.forEach((subject) => {
            const subjectGraduationType = subject.GraduationType;
            const isGraduationTypeMatch =
              graduationType === "all" ||
              subjectGraduationType === graduationType;
            if (isGraduationTypeMatch) {
              filteredSubjects.push({
                collegeName: college.name,
                departmentName: course.deptName,
                subjectName: subject.subjectId.name, 
                graduationType: subjectGraduationType,
                noOfSemesters: subject.noOfSemesters,
                feePerSemester: subject.feePerSemester,
              });
            }
          });
        }
      });
    });
    console.log("Final filtered subjects:", filteredSubjects);
    res.render("./user/pages/admissions", {
      colleges,
      departments: await College.distinct("courses.deptName"),
      subjects: filteredSubjects.length ? filteredSubjects : [],
      states: await College.distinct("state"),
      types: await College.distinct("type"),
      categories: await College.distinct("category"),
      graduationTypes: await College.distinct(
        "courses.subjects.GraduationType"
      ),
      selectedFilters: { group, state, type, category, graduationType }, 
    });
  } catch (error) {
    console.error("Error in filterAdmissions:", error);
    res.status(500).render("error", { error: "Something went wrong" });
  }
};







const loadDeptAdmissions = async (req, res) => {
  try {
      const departmentId = req.params.deptId;
      console.log("Received deptId:", departmentId);

      // Clear previous session data
      if (req.session.deptId) {
          console.log("Clearing existing session deptId:", req.session.deptId);
          req.session.deptId = null;
      }

      // Validate departmentId
      if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
          console.error("Invalid department ID:", departmentId);
          return res.status(400).send("Invalid department ID");
      }

      req.session.deptId = departmentId;

      // Fetch the department
      const department = await Department.findById(departmentId);
      if (!department) {
          console.error("Department not found for ID:", departmentId);
          return res.status(404).send("Department not found");
      }

      // Fetch colleges associated with the department
      const colleges = await College.find({ "courses.deptId": departmentId });
      if (!colleges.length) {
          console.log("No colleges found for department:", departmentId);
      }

      res.render("./user/pages/deptAdmissions", {
          colleges,
          department,
      });
  } catch (error) {
      console.error("Error in loadDeptAdmissions:", error);
      res.status(500).send("Server error");
  }
};






const loadCollegeApplication = async (req, res) => {
  try {
    const collegeId = req.params.collegeId;
    const deptId = req.session.deptId;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send("College not found");
    }
    const department = college.courses.find(
      (course) => course.deptId.toString() === deptId
    );
    if (!department) {
      return res.status(404).send("Department not found");
    }
    res.render("./user/pages/collegeApplication", {
      college,
      department,
    });
  } catch (error) {
    console.error("Error loading college application page:", error);
    res.status(500).send("Internal Server Error");
  }
};



const loadApplicationForm = async (req, res) => {
  try {
    const collegeId = req.params.collegeId;
    const deptId = req.session.deptId;
    const college = await College.findById(collegeId);
    const department = college.courses.find((course) =>
      course.deptId.equals(deptId)
    );
    if (!department) {
      return res.status(404).send("Department not found");
    }
    res.render("./user/pages/admissionApplication", {
      college,
      department,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};



const submitApplication = async (req, res) => {
  try {
    const { name, email, contact, course } = req.body;
    const userId = req.session.user._id;
    const collegeId = req.params.collegeId;
    const deptId = req.session.deptId;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send("College not found");
    }
    const department = college.courses.find((course) =>
      course.deptId.equals(deptId)
    );
    if (!department) {
      return res.status(404).send("Department not found");
    }
    const subject = department.subjects.find((sub) => sub._id.equals(course));
    if (!subject) {
      return res.status(404).send("Course not found");
    }
    const newApplication = new admissionApplication({
      userId: userId,
      name,
      email,
      contactNumber: contact,
      course: subject._id,
      status: "not yet contacted",
      collegeId: college._id,
      deptId: department.deptId,
      staff: {
        admission_id: "", 
        id: "", 
        date: null, 
      },
    });
    const savedApplication = await newApplication.save();
    const applicationId = savedApplication._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }
    user.applications.push(applicationId);
    await user.save();
    res.redirect("/admissions");
  } catch (err) {
    console.error("Error submitting application:", err);
    res.status(500).send("Server Error");
  }
};


const profilePage = async (req, res) => {
  try {
    console.log(req.session.user_id, 'ada mwone');
    
    const user = await User.findById(req.session.user_id).populate({
      path: "applications",
      populate: [
        {
          path: "collegeId",
          model: "College",
          select: "name",
        },
        {
          path: "deptId",
          model: "Department",
          select: "name",
        },
      ],
    });

    res.render("./user/pages/profilePage", { user: user || null, title: "profilePage" });
  } catch (error) {
    console.error("Error loading profile page:", error);
    res.status(500).render("./user/pages/profilePage", {
      user: null,
      title: "profilePage",
      error: "An error occurred while loading the profile.",
    });
  }
};




const loadEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);
    res.render("./user/pages/editProfile", { user, title: "editProfilePage" });
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
      return res.status(404).send("User not found");
    }
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Could not log out, please try again.");
    }
    res.redirect("/");
  });
};



module.exports = {
  loadUserRegistration,
  userSignUP,
  loadLogin,
  verifyLogin,
  loadHome,
  sendOtp,
  verifyOtp,
  resendOtp,
  loadUniversityServices,
  loadAdmissions,
  filterAdmissions,
  loadDeptAdmissions,
  loadCollegeApplication,
  loadApplicationForm,
  submitApplication,
  profilePage,
  loadEditProfile,
  editProfile,
  logout,
};