const mongoose = require('mongoose');
const College = require('../model/collegeModel');
const Department = require('../model/departmentModel');
const Subject = require('../model/subjectModel');
const bcrypt = require('bcrypt');
const AdmissionApplication = require('../model/admissionApplication');





//for logout action
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/college');
  });
};




const loadLogin = async (req, res) => {
  try {
    res.render('./college/pages/acclogin', { title: 'collegeLogin' });
  } catch (error) {
    throw new Error(error);
  }
};




// Login function
const login = async (req, res) => {
  try {
    const identifier = req.body.identifier;
    const password = req.body.password;
    let college;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      college = await College.findOne({ _id: identifier });
    } else {
      college = await College.findOne({ email: identifier });
    }

    if (!college) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, college.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    } else {
      req.session.collegeId = college._id; // Set the session key to the college ID
      res.render('./college/pages/dashboard', { title: 'Dashboard', college, message: 'Login successful' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};





const loadDashboard = async (req, res) => {
  try {
    const college = await College.findById(req.session.collegeId);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }
    res.render('./college/pages/dashboard', { title: 'college dashboard', college });
  } catch (error) {
    throw new Error(error);
  }
};




const getAllCourses = async (req, res) => {
  try {
    const collegeId = req.session.collegeId;

    if (!collegeId) {
      return res.status(401).send('Unauthorized');
    }

    const college = await College.findById(collegeId).populate('courses.deptId');

    if (!college || !college.courses || college.courses.length === 0) {
      return res.render('./college/pages/courses', { courses: [], message: 'No courses added yet.', title: 'Courses' });
    }

    res.render('./college/pages/courses', { courses: college.courses, message: null, title: 'Courses' });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};




// Controller for getting all departments
const getAllDepartments = async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const collegeId = req.session.collegeId;

    if (!collegeId) {
      return res.status(401).send('Unauthorized');
    }

    // Fetch the college's existing departments
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send('College not found');
    }

    const collegeDeptIds = college.courses.map(course => course.deptId);

    // Fetch departments that are not assigned to any college or already in the current college's list
    const departments = await Department.find({
      name: new RegExp(searchQuery, 'i'),
      $or: [
        { _id: { $nin: collegeDeptIds } }
      ]
    });

    res.render('./college/pages/addCourse', { departments, title: 'getAllDepartments' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};






const addSelectedDepartments = async (req, res) => {
  try {
    const { departments } = req.body;
    const collegeId = req.session.collegeId;

    if (!collegeId) {
      return res.status(401).send('Unauthorized');
    }

    if (!departments || !Array.isArray(departments)) {
      return res.status(400).send('No departments selected');
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send('College not found');
    }

    // Ensure existing courses have a deptName
    for (const course of college.courses) {
      if (!course.deptName) {
        const department = await Department.findById(course.deptId);
        if (department && department.name) {
          course.deptName = department.name;
        } else {
          console.error('Invalid department or missing department name:', department);
          return res.status(400).send('Invalid department or missing department name in existing courses');
        }
      }
    }

    const selectedDepartments = await Department.find({
      _id: { $in: departments },
    });

    if (selectedDepartments.length === 0) {
      return res.status(404).send('No valid departments selected');
    }

    for (const department of selectedDepartments) {
      if (!department.name) {
        console.error('Department name is missing:', department);
        return res.status(400).send('Invalid department: Department name is missing');
      }

      // Ensure no duplicate department is added
      if (!college.courses.some(course => course.deptId.equals(department._id))) {
        college.courses.push({
          deptId: department._id,
          deptName: department.name,
          subjects: [] // Initialize subjects array if needed
        });
      }
    }

    // Log the college object before saving
    console.log('College object before saving:', JSON.stringify(college, null, 2));

    try {
      await college.save();
      res.redirect('/college/dashboard');
    } catch (saveError) {
      console.error('Error saving college:', saveError);
      if (saveError.name === 'ValidationError') {
        res.status(400).send(`Validation Error: ${saveError.message}`);
      } else {
        res.status(500).send('Error saving college');
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).send('Server error');
  }
};









// Controller for searching departments
const searchDepartments = async (req, res) => {
  const searchQuery = req.query.q;
  try {
    const departments = await Department.find({
      name: { $regex: searchQuery, $options: 'i' }
    });
    res.render('./college/pages/addCourse', { departments, title: 'Add Course' });
  } catch (error) {
    res.status(500).send('Server error');
  }
};




const getSubjectsByDept = async (req, res) => {
  try {
    const { deptId } = req.params; // Department ID passed in request parameters
    const collegeId = req.session.collegeId; // College ID from session

    // Find the college document containing the specified department
    const college = await College.findOne({ "courses.deptId": deptId });

    // Check if college is found
    if (!college) {
      return res.status(404).send('College not found');
    }

    // Extract department details from the found college's courses array
    const department = college.courses.find(course => course.deptId.equals(deptId));

    // If department is not found within the college's courses, send error
    if (!department) {
      return res.status(404).send('Department not found');
    }

    // Extract the subjects linked to the found department
    const deptSubjects = department.subjects;

    // Render the subjects view with department and subject details
    res.render('./college/pages/subjects', {
      subjects: deptSubjects, // Pass the filtered subjects linked to the department
      department, // Pass the department details
      deptId, // Pass the department ID for further use
      title: `All Subjects in ${department.deptName}` // Dynamic title for the view
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).send('Server error');
  }
};




// Get All Subjects
const getAllSubjects = async (req, res) => {
  try {
    const { deptId } = req.params;
    const collegeId = req.session.collegeId;
    const searchQuery = req.query.q || '';

    // Find all subjects linked to the specified department ID
    const allSubjects = await Subject.find({ 'department._id': deptId });

    // Find the college document containing the specified department
    const college = await College.findOne({ "courses.deptId": deptId });

    // Check if college is found
    if (!college) {
      return res.status(404).send('College not found');
    }

    // Extract subjects belonging to the department
    const deptSubjects = college.courses.find(course => course.deptId.equals(deptId)).subjects.map(subject => subject.subjectId.toString());

    // Filter subjects that are not already listed in the college's courses
    const filteredSubjects = allSubjects.filter(subject => !deptSubjects.includes(subject._id.toString()));

    // Apply search filter (case-insensitive)
    const searchedSubjects = searchQuery
      ? filteredSubjects.filter(subject => subject.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : filteredSubjects;

    // Extract department details from the found college course
    const department = college.courses.find(course => course.deptId.equals(deptId));

    res.render('./college/pages/addSubject', {
      subjects: searchedSubjects,
      department,
      deptId,
      title: 'Subjects',
      searchQuery, // Pass search query to the template
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};





const searchSubjects = async (req, res) => {
  const searchQuery = req.body.query;
  try {
    const subjects = await Subject.find({
      name: { $regex: searchQuery, $options: 'i' }
    });
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};



// to add the selected subjects to the college db
const addSelectedSubjects = async (req, res) => {
  const { selectedSubjects, noOfSemesters, feePerSemester, deptId } = req.body;
  const collegeId = req.session.collegeId;

  if (!collegeId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send('College not found');
    }

    const subjectsToAdd = Array.isArray(selectedSubjects) ? selectedSubjects : [selectedSubjects];

    for (const subjectId of subjectsToAdd) {
      const subject = await Subject.findById(subjectId);

      if (!subject) {
        return res.status(404).send(`Subject with ID ${subjectId} not found`);
      }

      // Fetch the course (department) where the subject is to be added
      const course = college.courses.find(course => course.deptId.equals(deptId));
      if (!course) {
        return res.status(404).send(`Department with ID ${deptId} not found in college`);
      }

      // Check if the subject already exists in the course
      const existingSubject = course.subjects.find(s => s.subjectId.toString() === subjectId);

      if (!existingSubject) {
        // Add the new subject with its graduation type
        course.subjects.push({
          subjectId,
          name: subject.name,
          noOfSemesters,
          feePerSemester,
          GraduationType: subject.GraduationType, // Add GraduationType from the Subject DB
        });
      }
    }

    await college.save();
    res.redirect('/college/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};




// Controller to load admissions for a particular college
const loadAdmissionsPage = async (req, res) => {
  try {
    // Get the collegeId from the session
    const collegeId = req.session.collegeId;

    if (!collegeId) {
      return res.status(400).send('No college selected.');
    }

    // Fetch the college details
    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(404).send('College not found.');
    }

    // Fetch the applications with status 'took admission'
    const applications = await AdmissionApplication.find({
      collegeId: collegeId,
      status: 'took admission',
    })
    .populate('course', 'name') // Populate course with only the name field
    .populate('deptId', 'name') // Populate department with only the name field
    .populate('userId', 'name'); // Optionally populate the user if needed


    // Check if there are applications
    if (!applications || applications.length === 0) {
      return res.render('./college/pages/admissions', {
        college: college.name,
        applications: [],
        message: 'No admissions have been taken yet.',
        title: 'Admissions Page', // Ensure title is passed correctly
      });
    }

    // Render the EJS template with the application data
    res.render('./college/pages/admissions', {
      college: college.name,
      applications: applications, // Pass the applications array to the view
      message: null, // No error message, since there are applications
      title: 'Admissions Page' // Pass the title for the page
    });
  } catch (error) {
    console.error('Error loading admissions:', error);
    res.status(500).send('Server error');
  }
};




// Controller to load admission requests for a particular college
const loadAdmissionRequestsPage = async (req, res) => {
  try {
    // Get the collegeId from the session
    const collegeId = req.session.collegeId;

    if (!collegeId) {
      return res.status(400).send('No college selected.');
    }

    // Fetch the college details
    const college = await College.findById(collegeId);

    if (!college) {
      return res.status(404).send('College not found.');
    }

    // Fetch the applications with status 'college approval pending'
    const applications = await AdmissionApplication.find({
      collegeId: collegeId,
      status: 'college approval pending',
    })
    .populate('course', 'name') // Populate course with only the name field
    .populate('deptId', 'name') // Populate department with only the name field
    .populate('userId', 'name'); // Optionally populate the user if needed

    // Render the EJS template with the application data
    res.render('./college/pages/admissionRequests', {
      college: college.name,
      applications: applications, // Pass the applications array to the view
      title: 'Admission Requests Page' // Pass the title for the page
    });
  } catch (error) {
    console.error('Error loading admission requests:', error);
    res.status(500).send('Server error');
  }
};







const updateAdmissionStatus = async (req, res) => {
  try {
    // Get the application ID and action from the URL parameters
    const { applicationId, action } = req.params;

    // Find the application by ID
    const application = await AdmissionApplication.findById(applicationId);

    if (!application) {
      return res.status(404).send('Admission application not found.');
    }

    // Update the status based on the action (accept or reject)
    if (action === 'accept') {
      application.status = 'took admission';

      // Find the associated college
      const college = await College.findById(application.collegeId);
      if (!college) {
        return res.status(404).send('College not found.');
      }

      // Add the admission application ID to the college's admissions array if not already present
      if (!college.admissions.includes(application._id)) {
        college.admissions.push(application._id);
        await college.save();
      }
    } else if (action === 'reject') {
      application.status = 'Declined by college';
    } else {
      return res.status(400).send('Invalid action.');
    }

    // Save the updated application status
    await application.save();

    // Redirect back to the admission requests page
    res.redirect('/college/admission-requests');
  } catch (error) {
    console.error('Error updating admission status:', error);
    res.status(500).send('Server error');
  }
};




module.exports = {
  loadLogin,
  logout ,
  login,
  loadDashboard,
  getAllCourses,
  getAllDepartments,
  searchDepartments,
  addSelectedDepartments,
  getSubjectsByDept,
  searchSubjects,
  getAllSubjects,
  addSelectedSubjects,
  loadAdmissionsPage,
  loadAdmissionRequestsPage,
  updateAdmissionStatus
};
