const express = require('express');
const path = require('path');
const collegeRoute = express.Router();
const expressLayouts = require('express-ejs-layouts'); 
const multer = require('multer');
const collegeController = require('../controller/collegeController');




const collegeAuth=require('../middleware/collegeAuth')


require('dotenv').config()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    cb(null, path.join(__dirname, '../public/college/uploads'));},


  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });



collegeRoute.use(express.json());
collegeRoute.use(express.urlencoded({ extended: true }));
collegeRoute.use((req, res, next) => {
  req.app.set('layout', 'college/layout/college');
  next();
});







//for login
collegeRoute.get('/',collegeAuth.isLogout, collegeController.loadLogin);
collegeRoute.post('/',collegeAuth.isLogout ,collegeController.login);
collegeRoute.get('/logout',collegeAuth.isLogin , collegeController.logout);

collegeRoute.get('/dashboard',collegeAuth.isLogin , collegeController.loadDashboard);


collegeRoute.get('/courses',collegeAuth.isLogin, collegeController.getAllCourses);



collegeRoute.get('/departments', collegeAuth.isLogin, collegeController.getAllDepartments);

collegeRoute.get('/departments/search', collegeAuth.isLogin, collegeController.searchDepartments);
collegeRoute.post('/departments/add', collegeAuth.isLogin, collegeController.addSelectedDepartments);




collegeRoute.get('/:deptId/subjects', collegeAuth.isLogin, collegeController.getSubjectsByDept);
collegeRoute.get('/:deptId/allSubjects', collegeAuth.isLogin, collegeController.getAllSubjects);
collegeRoute.post('/:deptId/subjects/search', collegeAuth.isLogin, collegeController.searchSubjects);
collegeRoute.post('/subjects/add', collegeAuth.isLogin, collegeController.addSelectedSubjects);




module.exports = collegeRoute;