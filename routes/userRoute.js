const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const user_route = express.Router();
const userController = require('../controller/userController.js');
const servicesController = require('../controller/servicesController.js');
const userAuth = require('../middleware/userAuth');
const mongoose = require('mongoose');
const config = require('../config/config');
const session = require('express-session');

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


// Routes accessible to university services
user_route.get('/universityServices', userController.loadUniversityServices);
user_route.get('/applyForCertificate', servicesController.loadApplyForCertificate);
user_route.post('/applyForCertificate', servicesController.applyForCertificate);


module.exports = user_route;
