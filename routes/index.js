const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');

const router = express.Router();
const db = require('../db');
const { fetchPdfFromStorage } = require('../azureStorage');
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
      res.render('reports-admin', { title: 'All Test Reports', reports: reportRows, user: req.session.user });
    } else if (req.session.user && req.session.user.role === 'client') {
      // Client view: Show reports for the logged-in client
      const [clientRows] = await db.execute('SELECT * FROM clients WHERE id = ?', [req.session.user.id]);
      const [reportRows] = await db.execute('SELECT * FROM reports WHERE clientId = ?', [req.session.user.id]);
      res.render('reports-client', { title: 'Customer Reports', client: clientRows[0], reports: reportRows, user: req.session.user });
    } else {
      res.render('dashboard/unauthorized', { title: 'Unauthorized Access', user: req.session.user });
    }
  } catch (error) {
    console.error('Error fetching data from database:', error.message);
    res.status(500).send('Error fetching data from database');
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
