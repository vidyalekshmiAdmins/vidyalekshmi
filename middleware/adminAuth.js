
const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      // Admin is logged in
      next();
    } else {
      // Admin is not logged in, redirect to login page
      res.redirect('/admin/');
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      // Admin is logged in, redirect to home
      res.redirect('/admin/dashboard');
    } else {
      // Admin is not logged in
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
