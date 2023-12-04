// authMiddleware.js

function ensureAuthenticated(req, res, next) {
    // If the user is already authenticated and tries to access the /login route, redirect to /
    if (req.session && req.session.user && req.path === '/login') {
        return res.redirect('/');
    }

    // Exclude the /login route from authentication check
    if (req.path === '/login') {
      return next();
    }
  
    if (req.session && req.session.user) {
      return next();
    } else {
      res.redirect('/login');
    }
  }
  
  module.exports = ensureAuthenticated;
  