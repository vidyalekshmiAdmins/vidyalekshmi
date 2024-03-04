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

// Serve static files
index.use(express.static('public'));
index.use('/user', express.static(__dirname + '/public/user'));

// Set up express-ejs-layouts
// index.use(expressLayouts);



// Use routes after session middleware
const userRoute = require('./routes/userRoute');
index.use('/', userRoute);


// const adminRoute = require('./routes/adminRoute');
// index.use('/admin', adminRoute);

index.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the site`);
});

database.dbConnect();
