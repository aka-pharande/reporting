// routes/index.js
const express = require('express');
const router = express.Router();
const sampleReports = require('../reportsData');
const { fetchPdfFromStorage } = require('../azureStorage');

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

router.get('/download-pdf/:reportId', async function (req, res, next) {
  const reportId = parseInt(req.params.reportId); // Convert to integer

  try {
    const report = sampleReports.find(report => report.id === reportId);

    if (!report) {
      res.status(404).send('Report not found');
      return;
    }

    const pdfBuffer = await fetchPdfFromStorage(report);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report.reportName}`);

    // Send the PDF content to the client
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    // Handle errors appropriately
    res.status(500).send('Error fetching PDF from storage');
  }
});


module.exports = router;
