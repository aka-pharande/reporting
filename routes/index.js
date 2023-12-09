const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const multer = require('multer');

// const upload = multer({ dest: 'uploads/' }); // Set your desired upload directory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();
const db = require('../db');
const { fetchPdfFromStorage } = require('../azureStorage');
const { uploadPdfToStorage } = require('../azureStorage');
const authMiddleware = require('../authMiddleware');

router.use(authMiddleware);

// Home route - Display clients
router.get('/', async function (req, res, next) {
  try {
    const { user } = req.session;
    res.render('index', { title: 'Ashwamedh Reports', user });
  } catch (error) {
    res.status(500).send('Error rendering');
  }
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [userRows] = await db.execute('SELECT * FROM clients WHERE username = ?', [username]);

    if (userRows.length === 1) {
      const user = userRows[0];

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role
        };

        res.redirect('/');
        return;
      }
    }

    res.render('login', { error: 'Invalid username or password' });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send('Error during login');
  }
});

// Logout route
router.get('/logout', (req, res) => {
  // Clear the user session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).send('Error during logout');
    } else {
      res.redirect('/login');
    }
  });
});

// Home route - Display clients
router.get('/clients', async function (req, res, next) {
  try {
    if (req.session.user && req.session.user.role !== 'admin') {
      res.status(403).send('Unauthorized - You are not authorized to view the list of customers');
    }
    const [rows] = await db.execute('SELECT * FROM clients where role = "client"');
    res.render('clients', { title: 'Your Customers', clients: rows, user: req.session.user });
  } catch (error) {
    console.error('Error fetching clients from database:', error.message);
    res.status(500).send('Error fetching clients from database');
  }
});

// Reports route - Display reports for a specific client
router.get('/reports', async function (req, res, next) {
  try {
    // Check if user is an admin
    if (req.session.user && req.session.user.role === 'admin') {
      // Admin view: Show all reports
      const [reportRows] = await db.execute('SELECT * FROM reports');
      const [clientsRows] = await db.execute('SELECT * FROM clients where role = "client"');
      res.render('reports-admin', { title: 'All Test Reports', reports: reportRows, clients: clientsRows });
    } else if (req.session.user && req.session.user.role === 'client') {
      // Client view: Show reports for the logged-in client
      const [clientRows] = await db.execute('SELECT * FROM clients WHERE id = ?', [req.session.user.id]);
      const [reportRows] = await db.execute('SELECT * FROM reports WHERE clientId = ?', [req.session.user.id]);
      res.render('reports-client', { title: 'Customer Reports', client: clientRows[0], reports: reportRows });
    } else {
      res.render('dashboard/unauthorized', { title: 'Unauthorized Access', user: req.session.user });
    }
  } catch (error) {
    console.error('Error fetching data from database:', error.message);
    res.status(500).send('Error fetching data from database');
  }
});


router.post('/upload-report', upload.single('reportFile'), async (req, res) => {
  // Check if the user is an admin
  if (req.session.user && req.session.user.role === 'admin') {
    const report = {
      clientId: req.body.clientId,
      name: req.body.reportName,
      fileName: req.body.fileName || req.file.originalname,
      file: req.file  
    }

    try {
      // Perform necessary validations on clientId, reportName, and reportFile
      if (!report.clientId || !report.name) {
        // Handle validation errors
        return res.status(400).send('Invalid input data');
      }

      await uploadPdfToStorage(report);

      // Save report details to the database
      const [result] = await db.execute(
        'INSERT INTO reports (name, fileName, date, clientId) VALUES (?, ?, ?, ?)',
        [report.name, report.fileName, new Date(), report.clientId]
      );

      if (result.affectedRows === 1) {
        const successMessage = 'Report uploaded successfully!';
        const [reportRows] = await db.execute('SELECT * FROM reports');
        const [clientsRows] = await db.execute('SELECT * FROM clients where role = "client"');
        res.render('reports-admin', { title: 'All Test Reports', reports: reportRows, clients: clientsRows, successMessage });
      } else {
        res.status(500).send('Error uploading report');
      }
    } catch (error) {
      console.error('Error during report upload:', error.message);
      res.status(500).send('Error during report upload');
    }
  } else {
    // Redirect unauthorized users
    res.redirect('/');
  }
});


router.get('/download-pdf/:reportId', async function (req, res, next) {
  const reportId = parseInt(req.params.reportId);

  try {
    const [report] = await db.execute('SELECT * FROM reports WHERE id = ?', [reportId]);

    if (!report) {
      res.status(404).send('Report not found');
      return;
    }

    const pdfBuffer = await fetchPdfFromStorage(report[0]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report[0].fileName}`);

    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    res.status(500).send('Error fetching PDF from storage');
  }
});

module.exports = router;
