const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const user_route = express.Router();
const userController = require('../controller/userController.js');
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


//for signup
user_route.get('/signup', userAuth.isLogout, userController.loadUserRegistration);
user_route.post('/signup', userAuth.isLogout, userController.userSignUP);




//for login 
user_route.get('/login', userAuth.isLogout, userController.loadLogin)
user_route.post('/login', userAuth.isLogout, userController.verifyLogin)




//for home page 

user_route.get('/', userAuth.isLogout, userController.loadHome)


module.exports = user_route; 