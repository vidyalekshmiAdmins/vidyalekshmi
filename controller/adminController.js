const College = require('../model/collegeModel');
const User = require('../model/userModel');

const admin={
  ADMIN_PASSWORD:  "admin123",
ADMIN_EMAIL: "admin123@gmail.com"
};

const loadLogin = async (req, res) => {
  try {
    res.render('./admin/pages/acclogin', { title: 'adminLogin' });
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

// User Management
const userManagement = async (req, res) => {
  try {
    const findUsers = await User.find();
    res.render('./admin/pages/userList', { users: findUsers, title: 'UserList' });
  } catch (error) {
    throw new Error(error);
  }
};

// // Search User
// const searchUser = async (req, res, next) => {
//   try {
//     const data = req.body.search;
//     const searching = await User.find({ userName: { $regex: data, $options: 'i' } });

//     if (searching) {
//       return res.render('./admin/pages/userList', { users: searching, title: 'Search' });
//     } else {
//       return res.render('./admin/pages/userList', { title: 'Search' });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

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



// Controller function to render the order list page
const collegeList = async (req, res) => {
  try {
    // Fetch all orders from the database, populating user and product details
    const college = await College.find().populate('user products.product');

    

    // Render the order list page within the context of the admin layout
    res.render('./admin/pages/collegelist', { orders,orderStatus, title: 'Order List' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};






// Controller function to render the order details page
const orderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('user products.product');
console.log(orderId);
    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('./admin/pages/orderDetails', { order ,title: 'Order Details'});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};






module.exports = {
  loadLogin,
  loadDashboard,
  login,
  userManagement,
 // searchUser,
  userAction,
  orderList,
  orderDetails,
};
