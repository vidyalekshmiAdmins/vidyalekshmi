const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const user_route = express.Router();
const userController = require('../controller/userController.js');
const multer = require('multer');
const servicesController = require('../controller/servicesController.js');
const userAuth = require('../middleware/userAuth');
const mongoose = require('mongoose');
const config = require('../config/config');
const session = require('express-session');





const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    cb(null, path.join(__dirname, '../public/user/uploads'));},


  filename: function (req, file, cb) {
    const name=Date.now()+ '-'+file.originalname;
    cb(null,name)
    // cb(null, file.fieldname  + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
module.exports = {upload};






user_route.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false
}));



user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));



// Routes accessible only to logged out users
user_route.get('/signup', userAuth.isLogout, userController.loadUserRegistration);
user_route.post('/signup', userAuth.isLogout, userController.userSignUP);

// Routes accessible only to logged in users
user_route.get('/', userController.loadHome);
user_route.get('/verify', userAuth.isLogin, userController.sendOtp);
user_route.post('/verify', userAuth.isLogin, userController.verifyOtp);


// Routes accessible to both logged in and logged out users
user_route.get('/login', userAuth.isLogout, userController.loadLogin);
user_route.post('/login', userAuth.isLogout, userController.verifyLogin);
user_route.post('/logout', userAuth.isLogout, userController.logout);



//for loading the profile page
user_route.get('/profile', userAuth.isLogin, userController.profilePage);
user_route.get('/editProfile', userAuth.isLogin, userController.loadEditProfile);
user_route.post('/profile/update', userAuth.isLogin, userController.editProfile);




user_route.get('/universityServices', userAuth.isLogin, userController.loadUniversityServices);
user_route.get('/applyForCertificate', userAuth.isLogin, servicesController.loadApplyForCertificate);
user_route.post('/applyForCertificate', userAuth.isLogin, servicesController.applyForCertificate);




// Route for loading the admissions page
user_route.get('/admissions', userAuth.isLogin, userController.loadAdmissions);
user_route.post('/admissions/filter', userAuth.isLogin, userController.filterAdmissions);
user_route.get('/departments/:deptId', userAuth.isLogin, userController.loadDeptAdmissions);

user_route.get('/collegeApplication/:collegeId', userAuth.isLogin, userController.loadCollegeApplication);

user_route.get('/admissionApplication/:collegeId', userAuth.isLogin, userController.loadApplicationForm);

// Route for handling form submission

user_route.post('/apply/submit/:collegeId', userAuth.isLogin, userController.submitApplication);







module.exports = user_route;






