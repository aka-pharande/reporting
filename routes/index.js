// index.js
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const router = express.Router();
const db = require('../db');
const authMiddleware = require('../authMiddleware'); 
const { fetchPdfFromStorage } = require('../azureStorage');

// router.use(function (req, res, next) {
//   // Initialize express-session middleware before this middleware

//   if (!req.session.user) {
//     req.session.user = {
//       id: 1,
//       username: 'abc',
//       role: 'admin'
//     };
//   }
//   next();
// });

// router.use(authMiddleware);

// Home route - Display clients
router.get('/', async function(req, res, next) {
  try {
    res.render('index', { title: 'Ashwamedh Reports'});
  } catch (error) {
    res.status(500).send('Error rendering');
  }
});

router.get('/login', (req, res, next) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username)
  console.log(password)

  try {
    const [userRows] = await db.execute('SELECT * FROM clients WHERE username = ?', [username]);

    if (userRows.length === 1) {
      const user = userRows[0];
      console.log(user)
      // Compare the entered password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
      console.log(passwordMatch)
      if (passwordMatch) {
        // Set user information in the session
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role
        };

        res.redirect('/');
        return;
      }
    }

    // Invalid username or password
    res.render('login', { error: 'Invalid username or password' });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send('Error during login');
  }
});

// Home route - Display clients
router.get('/clients', async function(req, res, next) {
  try {
    const [rows] = await db.execute('SELECT * FROM clients');
    res.render('clients', { title: 'Your Customers', clients: rows });
  } catch (error) {
    console.error('Error fetching clients from database:', error.message);
    res.status(500).send('Error fetching clients from database');
  }
});

// Reports route - Display reports for a specific client
// In index.js
router.get('/reports', async function(req, res, next) {
  try {
    // Check if user is an admin
    if (req.session.user && req.session.user.role === 'admin') {
      // Admin view: Show all reports
      
      const [reportRows] = await db.execute('SELECT * FROM reports');
      res.render('reports-admin', { title: 'All Test Reports', reports: reportRows });
    } else {
      // Client view: Show reports for the logged-in client
      const [clientRows] = await db.execute('SELECT * FROM clients WHERE id = ?', [req.session.user.id]);
      const [reportRows] = await db.execute('SELECT * FROM reports WHERE clientId = ?', [req.session.user.id]);
      res.render('reports-client', { title: 'Customer Reports', client: clientRows[0], reports: reportRows });
    }
  } catch (error) {
    console.error('Error fetching data from database:', error.message);
    res.status(500).send('Error fetching data from database');
  }
});

router.get('/download-pdf/:reportId', async function (req, res, next) {
  const reportId = parseInt(req.params.reportId); // Convert to integer

  try {
    const [report] = await db.execute('SELECT * FROM reports WHERE id = ?', [reportId]);
    
    if (!report) {
      res.status(404).send('Report not found');
      return;
    }

    const pdfBuffer = await fetchPdfFromStorage(report[0]);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${report[0].fileName}`);

    // Send the PDF content to the client
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    // Handle errors appropriately
    res.status(500).send('Error fetching PDF from storage');
  }
});

module.exports = router;
