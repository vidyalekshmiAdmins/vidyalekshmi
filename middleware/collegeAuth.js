const isLogin = async (req, res, next) => {
  try {
    if (req.session.collegeId) {
      return next();
    } else {
      return res.redirect('/college/');
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send('Internal Server Error');
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.collegeId) {
      return res.redirect('/college/dashboard');
    } else {
      return next();
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).send('Internal Server Error');
  }
};
module.exports = {
  isLogin,
  isLogout,
};
