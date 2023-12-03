// routes/index.js
const express = require('express');
const router = express.Router();
const sampleReports = require('../reportsData');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Environmental Testing Lab' });
});

// Add a new route to fetch and display sample reports
router.get('/reports', function (req, res, next) {
  res.render('reports', { title: 'Test Reports', reports: sampleReports });
});

module.exports = router;
