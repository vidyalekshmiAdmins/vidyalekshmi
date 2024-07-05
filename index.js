const mongoose = require('mongoose');
const database = require('./config/db');
const express = require('express');
const index = express();
const nocache = require('nocache');
const expressLayouts = require('express-ejs-layouts'); // Updated import
const bodyParser = require('body-parser');
require('dotenv').config();
const session = require('express-session');
const ejs = require('ejs'); 
const PORT = process.env.PORT;

// Middleware to set Cache-Control header
index.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

index.use(bodyParser.urlencoded({ extended: true }));
index.set('view engine', 'ejs');
index.set('views', './views');
index.use(nocache());

// Configure session middleware
index.use(
  session({
    secret: 'your-long-random-secret',
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// Use routes after session middleware
const userRoute = require('./routes/userRoute');
index.use('/', userRoute);



// Serve static files
index.use(express.static('public'));
index.use('/user', express.static(__dirname + '/public/user'));

//Set up express-ejs-layouts
index.use(expressLayouts);



//for activating admin route

index.use(express.static('public'));
index.use('/admin', express.static(__dirname + '/public/admin'));
index.use(expressLayouts);

const adminRoute = require('./routes/adminRoute');
index.use('/admin', adminRoute);


//for activating college route


const collegeRoute = require('./routes/collegeRoute');
index.use('/college', collegeRoute);

index.use(express.static('public'));
index.use('/college', express.static(__dirname + '/public/college'));
index.use(expressLayouts);






index.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the site`);
});

database.dbConnect();
