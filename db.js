const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.AZURE_MYSQL_HOST || 'localhost',
  user: process.env.AZURE_MYSQL_USER || 'root',
  password: process.env.AZURE_MYSQL_PASSWORD || 'my_password',
  database: process.env.AZURE_MYSQL_DATABASE || 'ashwamedh-reports-database',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;