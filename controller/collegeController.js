const mongoose = require('mongoose');
const College = require('../model/collegeModel');
const Department = require('../model/departmentModel');
const Subject = require('../model/subjectModel');
const bcrypt = require('bcrypt');






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
    console.log('Selected Departments:', departments);

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
      // Check for validation errors
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
    const { deptId } = req.params;

    // Find the college that contains this department
    const college = await College.findOne({ "courses.deptId": deptId }, { "courses.$": 1 });
    if (!college) {
      return res.status(404).send('Department not found');
    }

    const department = college.courses[0];
    const subjects = department.subjects || [];

    res.render('./college/pages/subjects', {
      subjects,
      department,
      deptId,
      title: 'Subjects'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};






// Get All Subjects
const getAllSubjects = async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const collegeId = req.session.collegeId;
    const deptId = req.params.deptId; // Get department ID from request parameters

    if (!collegeId) {
      return res.status(401).send('Unauthorized');
    }

    // Fetch the college
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send('College not found');
    }

    // Find the specific department
    const department = college.courses.find(course => course.deptId.toString() === deptId);
    if (!department) {
      return res.status(404).send('Department not found');
    }

    // Collect all subject IDs from the department's subjects
    const collegeSubjectIds = department.subjects ? department.subjects.map(subject => subject.subjectId) : [];

    // Fetch subjects that are not already in the department's list
    const subjects = await Subject.find({
      name: new RegExp(searchQuery, 'i'),
      _id: { $nin: collegeSubjectIds }
    });

    res.render('./college/pages/addSubject', { subjects, title: 'Subjects', department, deptId, searchQuery });
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


// Add Selected Subjects
const addSelectedSubjects = async (req, res) => {
  const { selectedSubjects, noOfSemesters, feePerSemester } = req.body;
  const collegeId = req.session.collegeId;

  if (!collegeId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).send('College not found');
    }

    const subjectsToAdd = JSON.parse(selectedSubjects);
    subjectsToAdd.forEach(subjectId => {
      const subject = college.subjects.find(s => s.subjectId.toString() === subjectId);
      if (!subject) {
        college.subjects.push({
          subjectId,
          noOfSemesters,
          feePerSemester,
        });
      }
    });

    await college.save();
    res.redirect('/college/dashboard');
  } catch (error) {
    console.error(error);
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
  addSelectedSubjects
};
