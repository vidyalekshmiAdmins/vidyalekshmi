const College = require('../model/collegeModel');
const User = require('../model/userModel');
const Department = require('../model/departmentModel');
const Subject = require('../model/subjectModel');
const Staff = require('../model/staffModel');
const multer = require('multer');
const ApplyCertificate = require("../model/applyCertificate");
const AdmissionApplication = require("../model/admissionApplication");
const JobSection = require('../model/JobSection');


const bcrypt = require('bcrypt');
const upload= require("../routes/adminRoute");

const admin={
  ADMIN_PASSWORD:  "admin123",
ADMIN_EMAIL: "admin123@gmail.com"
};


//  const upload = multer({ dest: 'public/admin/uploads' });


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



//All things related to User

//for showing the user details
const getUserDetails = async (req, res) => {
  try {
      // Fetch user details from the database
      const user = await User.findById(req.params.id);
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Render the userDetail.ejs file with the user details
      res.render('./admin/pages/userDetails', { title: 'userDetails', user: user });
  } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).send('Internal Server Error');
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
    const {
      name,
      district,
      pincode,
      country,
      state,
      address,
      type,
      category,
      password,
      confirmPassword,
      email,
      noOfFaculty,
      establishedIn
    } = req.body;

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if email is valid
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for duplicate college based on name and district
    const existingCollege = await College.findOne({
      name,
      district,
      email
    });
    if (existingCollege) {
      return res.status(400).json({ message: 'College with this name already exists in the district!' });
    }

    // Check for duplicate email
    const existingEmail = await College.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Validate establishedIn is a positive integer
    if (!Number.isInteger(parseInt(establishedIn)) || parseInt(establishedIn) <= 0) {
      return res.status(400).json({ message: 'Established year should be a positive integer.' });
    }

    // Extracting image details from the request
    const images = req.files.map(file => ({
      name: file.originalname,
      path: file.path
    }));

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
      password: hashedPassword,
      email,
      noOfFaculty,
      establishedIn
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

    // Also delete all associated departments
    await Department.updateMany({ collegeId: id }, { collegeId: null });

    // Destroy session for the college
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.status(200).json({ message: 'College and associated data deleted successfully', deletedCollege });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting college' });
  }
};





//for services page 
const loadService = async (req, res) => {
  try {
    res.render('./admin/pages/services', { title: 'services' });
  } catch (error) {
    throw new Error(error);
  }
};






const loadEditPage = (req, res) => {
  try {
    const schemaFields = ApplyCertificate.schema.paths;
    res.render('./admin/pages/applyCertificate', {title: 'applyCertificate', schemaFields });
  } catch (error) {
    res.status(500).send(error);
  }
};





// for editing and making changes in the service field
const addFieldToSchema = async (req, res) => {
  const { fieldName, fieldType, fieldDescription } = req.body;

  if (!fieldName || !fieldType) {
    return res.status(400).send({ error: 'Field name and type are required.' });
  }

  try {
    ApplyCertificate.schema.add({
      [fieldName]: {
        type: mongoose.Schema.Types[fieldType],
        description: fieldDescription || ''
      }
    });

    res.redirect('/admin/EditPage');
  } catch (error) {
    res.status(500).send(error);
  }
};

const removeFieldFromSchema = async (req, res) => {
  const { fieldName } = req.body;

  if (!fieldName) {
    return res.status(400).send({ error: 'Field name is required.' });
  }

  try {
    ApplyCertificate.schema.remove(fieldName);
    res.redirect('/admin/EditPage');
  } catch (error) {
    res.status(500).send(error);
  }
};






// for viewing department
const viewDepartments = async (req, res) => {
  try {
    const departments = await Department.find();

    if (departments.length === 0) {
      return res.render('./admin/pages/cource1', { departments: null, message: 'No departments exist yet.', title: 'viewDepartments' });
    } else {
      res.render('./admin/pages/cource1', { departments, message: null, title: 'viewDepartments' });
    }
  } catch (error) {
    console.error('Error loading departments:', error.message, error.stack);
    res.status(500).json({ message: 'Error loading departments', error: error.message });
  }
};


// Render add department page
const loadAddDepartment = async (req, res) => {
  try {
    res.render('./admin/pages/addDepartment', { title: 'Add Department' });
  } catch (error) {
    console.error('Error loading add department page:', error.message);
    res.status(500).json({ message: 'Error loading add department page', error: error.message });
  }
};



const addDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    let image = req.files['image'] ? req.files['image'][0].filename : null;

  
    const newDepartment = new Department({ name, image });
    await newDepartment.save();

    res.redirect('/admin/department'); // Redirect to the departments list page
  } catch (error) {
    console.error('Error adding department:', error.message);
    res.status(500).json({ message: 'Error adding department', error: error.message });
  }
};






const loadDepartmentSubjects = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).render('./admin/pages/subject', { department: null, subjects: [], message: 'Department not found',  title: 'load Department Subjects'  });
    }

    const subjects = await Subject.find({ 'department._id': departmentId });

    res.render('./admin/pages/subject', {
      department,
      subjects,
      message: subjects.length === 0 ? 'No subjects added yet' : null,
      title: 'load Department Subjects'   });
  } catch (error) {
    console.error('Error loading department subjects:', error.message);
    res.status(500).json({ message: 'Error loading department subjects', error: error.message });
  }
};





const loadAddSubject = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.render('./admin/pages/addSubject', { department, title: 'Add Subject' });
  } catch (error) {
    console.error('Error loading add subject page:', error.message);
    res.status(500).json({ message: 'Error loading add subject page', error: error.message });
  }
};



const addSubject = async (req, res) => {
  try {
    const { name, graduationType } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(400).json({ message: 'Invalid department ID' });
    }

    const newSubject = new Subject({
      name,
      department: { _id: department._id, name: department.name },
      GraduationType: graduationType,
    });

    await newSubject.save();

    res.redirect(`/admin/department/${department._id}/subjects`);
  } catch (error) {
    console.error('Error adding subject:', error.message);
    res.status(500).json({ message: 'Error adding subject', error: error.message });
  }
};





const loadAdmissionController = async (req, res) => {
  try {


    if (!req.session.staffId) {
      return res.redirect('/admin/staff/verification'); // Redirect to verification if not logged in
    }

    
    const applications = await AdmissionApplication.find()
    .populate({
      path: 'collegeId',
      select: 'name',
    })
    .populate({
      path: 'deptId',
      select: 'name',
    });


    res.render('admin/pages/admissionController', { applications , title:'Admission COntroller' });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).send('Server Error');
  }
};



const loadApplicationDetails = async (req, res) => {
  try {
    const applicationId = req.params.id;

    const application = await AdmissionApplication.findById(applicationId)
      .populate('course', 'name') // Select only name from course
      .populate('collegeId', 'name') // Select only name from collegeId
      .populate('deptId', 'name')
      .populate('userId', 'name'); // Populate userId if needed

    if (!application) {
      return res.status(404).send('Application not found');
    }

    res.render('admin/pages/applicationDetails', { title: 'Application Details', application });
  } catch (err) {
    console.error("Error fetching application details:", err);
    res.status(500).send('Server Error');
  }
};



// FOR UPDATING APPLICATION STATUS OR REGISTERING ADMISSION
const updateApplicationDetails = async (req, res) => {
  try {
    const { status, admissionId, admissionDate } = req.body;
    const applicationId = req.params.id;
    const staffId = req.session.staffId; // Assuming staffId is stored in session

    // Find the application
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      return res.status(404).send('Application not found');
    }

    // Update application status
    application.status = status;

    // If the status is 'took admission', update the admission details
    if (status === 'took admission') {
      application.status = 'college approval pending'; // Updating to pending approval as per your logic
      application.staff = {
        admission_id: admissionId,
        date: admissionDate,
        id: staffId, // Set staff ID from session
      };

      // Find the staff and update the application field in staff document
      const staff = await Staff.findOne({ id: staffId });
      if (!staff) {
        return res.status(404).send('Staff not found');
      }

      // Update the application details in the staff document
      staff.application = {
        id: applicationId, // Set the application ID
        date: admissionDate, // Set the admission date
      };

      // Save the updated staff document
      await staff.save();
    }

    // Save the updated application
    await application.save();

    // Redirect to the application details page after saving
    res.redirect(`/admin/applications/${applicationId}`);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).send('Server Error');
  }
};



const loadStaffController = async (req, res) => {
  try {
    const sectionId = req.params.sectionId; 
    let staffList;

    if (sectionId) {
      // Fetch staff linked to the selected section/department
      staffList = await Staff.find({ 'jobRole.section': sectionId }, '-password');
    } else {
      // If no section is selected, fetch all staff
      staffList = await Staff.find({}, '-password');
    }

    const successMessage = req.query.message || null;
    const errorMessage = req.query.error || null;

    res.render('admin/pages/staffController', {
      staffList,           // Pass the staff list based on the section
      successMessage,      // Any success messages to be displayed
      errorMessage, 
      sectionId ,
      title: 'Staff Management',
    });
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).send('Server Error');
  }
};



const loadAddStaff = async (req, res) => {
  try {
    const sectionId= req.params.sectionId;

    if (!sectionId) {
      return res.status(400).send('Section ID not provided');
    }

    // Fetch the job section by the provided sectionId
    const jobSection = await JobSection.findById(sectionId);
    if (!jobSection) {
      return res.status(404).send('Job section not found');
    }

    // Render the add staff form with job roles related to the section
    res.render('admin/pages/addStaff', { jobRoles: jobSection.jobRoles, title: 'ADD STAFF',sectionId});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading page');
  }
};




const addStaffController = async (req, res) => {
  try {
    const sectionId = req.params.sectionId;  // Get sectionId from the URL params
    const { name, email, mobileNumber, alternativeNumber, jobRoleType, salary, password, confirmPassword } = req.body;

    // Password confirmation check
    if (password !== confirmPassword) {
      return res.render('admin/pages/addStaff', {
        errorMessage: 'Passwords do not match',
        title: 'Add Staff',
        sectionId // Pass sectionId back to the view to maintain it in the form action
      });
    }

    // Check if a staff member with the same email already exists
    const staffExists = await Staff.findOne({ email });
    if (staffExists) {
      return res.render('admin/pages/addStaff', {
        errorMessage: 'Staff with this email already exists',
        title: 'Add Staff',
        sectionId // Pass sectionId back to the view to maintain it in the form action
      });
    }

    // Create a new staff object
    const staff = new Staff({
      id: `STAFF-${Date.now()}`,
      name,
      email,
      mobileNumber,
      alternativeNumber,
      jobRole: {
        section: sectionId,
        type: jobRoleType,
      },
      salary,
      password,
      profilePicture: req.files['profilePicture'] ? req.files['profilePicture'][0].filename : null,
      documents: req.files['documents'] ? req.files['documents'].map(file => file.filename) : [],
    });

    // Save the staff to the database
    await staff.save();

    // Redirect to the staff management page with a success message
    res.redirect(`/admin/staff-management/${sectionId}?message=Staff ID generated successfully`);
  } catch (err) {
    console.error('Error adding staff:', err);
    res.status(500).send('Server Error');
  }
};









//for loading staff verification
const loadStaffVerification  = async (req, res) => {
if (!req.session.staffId) {
res.render('admin/pages/staffVerification', { title: 'Staff Verification' });
} else {
res.redirect('/admin/staff'); // Redirect to staff controller if already logged in
}
};




// for staff verification
const StaffVerification = async (req, res) => {
  try {
    const { emailOrId, password } = req.body; // Use 'password' (lowercase)

    const staff = await Staff.findOne({ $or: [{ email: emailOrId }, { id: emailOrId }] });


    if (!staff) {
      return res.status(401).json({ message: 'Invalid Email/ID or Password' });
    }

    const isMatch = await bcrypt.compare(password, staff.password); // Use staff.password

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid Email/ID or Password' });
    }

    req.session.staffId = staff._id;

    res.redirect('/admin/applications');
  } catch (err) {
    console.error("Error verifying staff:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};






const loadSectionsController = async (req, res) => {
  try {
    // Fetch all sections from the JobSection collection
    const sectionList = await JobSection.find({}, 'sectionName'); // Only fetch section names

    const successMessage = req.query.message || null;
    const errorMessage = req.query.error || null;

    // Render the page with the sections
    res.render('admin/pages/jobDepartmentController', {
      sectionList, // Send the list of section names to the template
      successMessage,
      errorMessage,
      title: 'Sections Controller',
    });
  } catch (err) {
    console.error("Error fetching sections:", err);
    res.status(500).send('Server Error');
  }
};





// Render add department page
const loadAddSection = async (req, res) => {
  try {
    const successMessage = req.query.message || null;  // Retrieve message from query, default to null
    const errorMessage = req.query.error || null;      // Retrieve error from query, default to null

    res.render('./admin/pages/addJobDepartment', { 
      title: 'Add JobDepartment',
      successMessage,  // Pass successMessage to the template
      errorMessage     // Pass errorMessage to the template
    });
  } catch (error) {
    console.error('Error loading add department page:', error.message);
    res.status(500).json({ message: 'Error loading add department page', error: error.message });
  }
};



// POST Controller for handling form submissions
const addSectionAndJobRoles = async (req, res) => {
  try {
    const { sectionName, jobRoles } = req.body;

    // Server-side validation for sectionName and jobRoles
    if (!sectionName || !jobRoles) {
      return res.redirect('/admin/sections-management?error=All%20fields%20are%20required');
    }

    // Create a new JobSection document
    const newSection = new JobSection({
      sectionName: sectionName.trim(),
      jobRoles: jobRoles.split(',').map(role => role.trim())  // Split jobRoles by commas and trim whitespace
    });

    // Save the new section
    await newSection.save();

    // Redirect with success message
    res.redirect('/admin/sections-management?message=Section%20added%20successfully');
  } catch (err) {
    console.error("Error adding section and job roles:", err);
    res.redirect('/admin/sections-management?error=Failed%20to%20add%20section');
  }
};








module.exports = {
  loadLogin,
  loadDashboard,
  login,
  userManagement,
 searchUser,
 getUserDetails,
  userAction,
  collegeList,
  loadCollegeDetails,
  loadAddCollege,
  addCollege,
  loadEditCollege,
  updateCollegeDetails,
  deleteCollege,
  loadService,
  loadEditPage,
  addFieldToSchema,
  removeFieldFromSchema,
  viewDepartments,
  addDepartment,
  loadAddDepartment,
  loadDepartmentSubjects,
  loadAddSubject,
  addSubject,
  loadAdmissionController,
  loadApplicationDetails,
  updateApplicationDetails,
  loadStaffController,
  loadAddStaff,
  addStaffController,
  loadStaffVerification,
  StaffVerification,
  loadSectionsController,
  loadAddSection,
  addSectionAndJobRoles,
};
