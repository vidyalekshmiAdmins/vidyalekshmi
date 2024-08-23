const isLogin = async (req, res, next) => {
  try {
      if (req.session.user) {
    
next();
} else {

res.redirect('/login');
}
} catch (error) {
console.log(error.message);
}
};

const isLogout = async (req, res, next) => {
  try {
      if (req.session.user) {
          // User is authenticated, redirect to the home page
          res.redirect('/');
      } else {
          // User is not authenticated, proceed to the next middleware or route handler
          next();
      }
  } catch (error) {
      console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout
};
