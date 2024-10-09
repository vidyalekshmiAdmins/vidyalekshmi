function isStaffVerified(req, res, next) {
  if (!req.session.staffId) {
    return res.redirect('/admin/staff/verification'); // Redirect to verification if not logged in
  }

  const staff = req.session.staff; // Assuming staff object is in session

  if (!staff) {
    return res.status(401).json({ message: 'Invalid Staff Session' }); // Handle invalid session
  }

  req.staff = staff; // Attach verified staff object to the request
  next();
}

module.exports = isStaffVerified;