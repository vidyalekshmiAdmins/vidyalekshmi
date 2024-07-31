const express = require('express');
const path = require('path');
const adminRoute = express.Router();
const expressLayouts = require('express-ejs-layouts'); 
const multer = require('multer');
const adminController = require('../controller/adminController');
// const categoryController = require('../controller/categoryController');
// const productController = require('../controller/productControl')
const adminAuth=require('../middleware/adminAuth')


require('dotenv').config()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    cb(null, path.join(__dirname, '../public/admin/uploads'));},


  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });





adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));
adminRoute.use((req, res, next) => {
  req.app.set('layout', 'admin/layout/admin');
  next();
});







adminRoute.get('/',adminAuth.isLogout, adminController.loadLogin);
adminRoute.post('/',adminAuth.isLogout ,adminController.login);

adminRoute.get('/dashboard',adminAuth.isLogin , adminController.loadDashboard);



adminRoute.get('/user',adminAuth.isLogin , adminController.userManagement)
adminRoute.get('/userDetails/:id', adminAuth.isLogin , adminController. getUserDetails);

//adminRoute.post('/user/search',adminController.searchUser)
adminRoute.get("/useractions",adminAuth.isLogin , adminController.userAction);



// // categoryManagement--- 
// adminRoute.get('/category',adminAuth.isLogin ,categoryController.categoryManagement)
// adminRoute.get('/addCategory',adminAuth.isLogin , categoryController.addCategory)
// adminRoute.post('/addCategory',adminAuth.isLogin , categoryController.insertCategory)
// adminRoute.get('/category/list/:id', adminAuth.isLogin ,categoryController.list)
// adminRoute.get('/category/unList/:id', adminAuth.isLogin ,categoryController.unList)
// adminRoute.get('/editCategory/:id',adminAuth.isLogin , categoryController.editCategory)
// adminRoute.post('/editCategory/:id',adminAuth.isLogin ,categoryController.updateCategory)
// adminRoute.post('/category/search',adminAuth.isLogin ,categoryController.searchCategory)



// // Product Management---
// adminRoute.get('/product',adminAuth.isLogin , productController.productManagement);
// adminRoute.get('/product/addProduct',adminAuth.isLogin , productController.addProduct);
// adminRoute.post('/product/addProduct',adminAuth.isLogin ,
//     upload.fields([
//         { name: "secondaryImage",maxCount:8 }
//         ,         { name: "primaryImage", maxCount: 3 }
//       ]),
//     productController.insertProduct)  /** Product adding and multer using  **/

//     adminRoute.post('/product/list/:id',adminAuth.isLogin , productController.listProduct);
//     adminRoute.post('/product/unList/:id',adminAuth.isLogin , productController.unListProduct);
//     adminRoute.get('/product/editproduct/:id',adminAuth.isLogin , productController.editProductPage);


// adminRoute.post('/product/editproduct/:id',adminAuth.isLogin ,
//     upload.fields([
//         { name: "secondaryImage", maxCount: 8 },
//         { name: "primaryImage", maxCount: 3 }
//     ]),
//     productController.updateProduct);


// // collegeManagement---

adminRoute.get('/College',adminAuth.isLogin ,adminController.collegeList);
adminRoute.get('/addCollege',adminAuth.isLogin ,adminController.loadAddCollege);
adminRoute.post('/addCollege', upload.array('images', 5),adminAuth.isLogin , adminController.addCollege);

adminRoute.get('/collegeDetails', adminAuth.isLogin, adminController.loadCollegeDetails);


adminRoute.get('/editCollege', adminAuth.isLogin, adminController.loadEditCollege);
adminRoute.post('/updateCollege', adminAuth.isLogin, adminController.updateCollegeDetails);

adminRoute.post('/deleteCollege/:id', adminAuth.isLogin,adminController.deleteCollege);




adminRoute.get('/services', adminAuth.isLogin, adminController.loadService);


// Load the schema edit page
adminRoute.get('/EditPage', adminAuth.isLogin, adminController.loadEditPage);

// Add a new field to the schema
adminRoute.post('/updateSchema', adminAuth.isLogin, adminController.addFieldToSchema);

// Remove a field from the schema
adminRoute.post('/removeField', adminAuth.isLogin, adminController.removeFieldFromSchema);




adminRoute.get('/department', adminAuth.isLogin, adminController.viewDepartments);

adminRoute.get('/department/add', adminAuth.isLogin, adminController.loadAddDepartment);

adminRoute.post('/department/add', adminAuth.isLogin, adminController.addDepartment);

adminRoute.get('/department/:id/subjects', adminAuth.isLogin, adminController.loadDepartmentSubjects);

adminRoute.get('/department/:id/subjects/add', adminAuth.isLogin, adminController.loadAddSubject);

adminRoute.post('/department/:id/subjects/add', adminAuth.isLogin, adminController.addSubject);


module.exports = adminRoute;
