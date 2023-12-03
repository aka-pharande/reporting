// routes/index.js
const express = require('express');
const router = express.Router();
const sampleReports = require('../reportsData');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Environmental Testing Lab' });
});

// Set a default client ID for demonstration purposes
router.use(function (req, res, next) {
  // Initialize express-session middleware before this middleware
  if (!req.session.clientId) {
    req.session.clientId = 1;
  }

  next();
});

router.get('/admin/reports', function (req, res, next) {
  res.render('reports-admin', { title: 'All Test Reports', reports: sampleReports });
});

router.get('/client/reports', function (req, res, next) {
  const clientId = req.session.clientId;

  if (!clientId) {
    res.redirect('/');
  } else {
    const clientReports = sampleReports.filter(report => report.clientId === clientId);
    res.render('reports-client', { title: 'Your Test Reports', reports: clientReports });
  }
});

module.exports = router;
