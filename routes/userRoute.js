const express = require('express');
const ejs = require('ejs');
const path = require('path');
const bodyParser = require('body-parser');
const user_route = express.Router(); // Use express.Router() to create a router
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

user_route.get('/signup', userAuth.isLogout, userController.loadUserRegistration);
user_route.post('/signup', userAuth.isLogout, userController.userSignUP);

user_route.get('/signin', userAuth.isLogout , userController.loadSignin)
user_route.post('/signin', userAuth.isLogout , userController.verifySignin)

module.exports = user_route; 