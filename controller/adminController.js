const College = require('../model/collegeModel');
const User = require('../model/userModel');
const multer = require('multer');

const admin={
  ADMIN_PASSWORD:  "admin123",
ADMIN_EMAIL: "admin123@gmail.com"
};


const upload = multer({ dest: 'public/admin/uploads' });


const loadLogin = async (req, res) => {
  try {
    res.render('./admin/pages/acclogin', { title: 'adminLogin' });
  } catch (error) {
    throw new Error(error);
  }
};




const login = async (req, res) => {
  try {
    const email = admin.ADMIN_EMAIL;
    const password = admin.ADMIN_PASSWORD;

    const emailCheck = req.body.email;
    const user = await User.findOne({ email: emailCheck });

    if (user) {
      return res.render('./user/pages/home');
    }

    if (emailCheck === email && req.body.password === password) {
      req.session.admin = true; // Set admin session
      return res.render('./admin/pages/index', { title: 'Dashboard' });
    } else {
      return res.render('./admin/pages/acclogin', { adminCheck: 'Invalid Credentials', title: 'adminLogin' });
    }
  } catch (error) {
    throw new Error(error);
  }
};

const loadDashboard = async (req, res) => {
  try {
    res.render('./admin/pages/index', { title: 'Dashboard' });
  } catch (error) {
    throw new Error(error);
  }
};



// User Management
const userManagement = async (req, res) => {
  try {
    const findUsers = await User.find();
    res.render('./admin/pages/userList', { users: findUsers, title: 'UserList' });
  } catch (error) {
    throw new Error(error);
  }
};

// Search User
const searchUser = async (req, res, next) => {
  try {
    const data = req.body.search;
    const searching = await User.find({ userName: { $regex: data, $options: 'i' } });

    if (searching) {
      return res.render('./admin/pages/userList', { users: searching, title: 'Search' });
    } else {
      return res.render('./admin/pages/userList', { title: 'Search' });
    }
  } catch (error) {
    next(error);
  }
};




// User Action
const userAction = async (req, res) => {
  const userID = req.query.id;
  const action = req.query.action;

  try {
    const user = await User.findById(userID);

    if (!user) {
      return res.status(400).send('User not found');
    }

    if (action === 'block') {
      user.isBLock = true;
    } else if (action === 'unblock') {
      user.isBLock = false;
    }
    if (req.body.password && req.body.password.length >= 6) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }
    await user.save();
    res.redirect('/admin/user');
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};




//AAL THINGS RELATED TO COLLEGES



//TO add colleges page
const loadAddCollege = async (req, res) => {
  try {
    res.render('./admin/pages/addCollege', { title: 'Add College' });
  } catch (error) {
    throw new Error(error);
  }
};


const addCollege = async (req, res) => {
  try {
    // Check for duplicate college based on name and district
    const existingCollege = await College.findOne({
      name: req.body.name,
      district: req.body.district
    });
    if (existingCollege) {
      return res.status(400).json({ message: 'College with this name already exists in the district!' });
    }

    const {
      name,
      district,
      pincode,
      country,
      state,
      address,
      type,
      category,
      courses
    } = req.body;

    // Extracting image details from the request
    const images = req.files.map(file => ({
      name: file.originalname,
      path: file.path
    }));

    // Create college object
    const college = new College({
      name,
      district,
      pincode,
      country,
      state,
      address,
      images,
      type,
      category,
      courses: courses.split(',').map(course => course.trim())
    });

    // Save the college to the database
    await college.save();

    res.status(201).json({ message: 'College added successfully!', college });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding college' });
  }
};






// Controller function to render the college list page
const collegeList = async (req, res) => {
  try {

   const colleges = await College.find();

    res.render('./admin/pages/collegelist', { colleges, title: 'college List' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};







// Controller function to render the specific college details page
const loadCollegeDetails = async (req, res) => {
  // Extract college ID from request query parameters
  const collegeId = req.query.id;

  try {
    // Logic to fetch college details from database using the collegeId
    const college = await College.findById(collegeId);

    if (!college) {
      // College not found
      return res.status(404).send('College not found');
    }

    // College details found, render collegeDetails ejs template with college data
    res.render('./admin/pages/collegeDetails', { college: college, title: 'College Details' });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};



// Controller function for editing college details
const loadEditCollege = async (req, res) => {
  try {
     
      const collegeId = req.query.id;

      
      const college = await College.findById(collegeId);

      if (!college) {
          // College not found
          return res.status(404).send('College not found');
      }

      // Render editCollege.ejs template with college data
      res.render('./admin/pages/editCollege', { college: college ,title: 'Edit College' });
  } catch (err) {
      // Handle errors
      console.error(err);
      res.status(500).send('Internal Server Error');
  }
};




const updateCollegeDetails = async (req, res) => {
  try {
    const id = req.body.id;
    console.log(id ,"nokkam");
    const existingCollege = await College.findById(id);

   // Handle images
  //  const updatedImages = [];
  //  if (req.files && req.files['images']) {
  //    // If new images are uploaded, update the images array
  //    req.files['images'].forEach((image) => {
  //      updatedImages.push({
  //        name: image.filename,
  //        path: image.path,
  //      });
  //    });
  //  } else {
  //    // If no new images are uploaded, retain the existing images
  //    existingCollege.images.forEach((image) => {
  //      updatedImages.push({
  //        name: image.name,
  //        path: image.path,
  //      });
  //    });
  //  }

    // Update college details
    const updatedCollege = await College.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        district: req.body.district,
        pincode: req.body.pincode,
        country: req.body.country,
        state: req.body.state,
        address: req.body.address,
        type: req.body.type,
        category: req.body.category,
        courses: req.body.courses.split(',').map((course) => course.trim()),
        // images: updatedImages,
        // Add more fields as needed
      },
      { new: true }
    );

    if (!updatedCollege) {
      return res.status(404).send('College not found');
    }

    res.redirect(`/admin/collegeDetails?id=${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};




const deleteCollege = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Find the college by ID and delete it
    const deletedCollege = await College.findByIdAndDelete(id);

    if (!deletedCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.status(200).json({ message: 'College deleted successfully', deletedCollege });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting college' });
  }
};



module.exports = {
  loadLogin,
  loadDashboard,
  login,
  userManagement,
 searchUser,
  userAction,
  collegeList,
  loadCollegeDetails,
  loadAddCollege,
  addCollege,
  loadEditCollege,
  updateCollegeDetails,
  deleteCollege
};
