// authMiddleware.js

module.exports = function(req, res, next) {
    // Check if the route is the login route
    if (req.originalUrl === '/login') {
      // If it's the login route, allow access without authentication
      next();
    } else if (req.session && req.session.user) {
      // User is authenticated, proceed to the next middleware/route
      next();
    } else {
      // User is not authenticated, redirect to the login page
      res.redirect('/login');
    }
  };
  