const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const sendEmail = require('./mailer');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const initializeDbConnection = async () => {
  try {
    console.log('Connecting to database...');

    // Connect to MySQL server (not a specific database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server');

    // Check if database exists, create it if it doesn't
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`Database '${process.env.DB_NAME}' is ready`);

    // Connect to the specific database
    await connection.changeUser({ database: process.env.DB_NAME });

    // Check if table exists, create it if it doesn't
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS refer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        referral_code VARCHAR(50) NOT NULL
      )`;
    await connection.query(createTableQuery);
    console.log('Table \'refer\' is ready');

    return connection;
  } catch (err) {
    console.error('Failed to connect to the database or create required structures:', err);
    process.exit(1); // Exit the process if there is a connection error
  }
};

initializeDbConnection().then(db => {
  app.post('/api/refer-check', async (req, res) => {
    const { name, email, referral_code } = req.body;
    const hardCodedReferralCode = 'REF123';

    if (!name || !email || !referral_code) {
      return res.status(400).send('All fields are required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send('Invalid email format');
    }

    if (referral_code !== hardCodedReferralCode) {
      return res.status(400).send('Invalid referral code');
    }

    try {
      const [result] = await db.execute('INSERT INTO refer (name, email, referral_code) VALUES (?, ?, ?)', [name, email, referral_code]);

      await sendEmail(
        email,
        'Referral Confirmation',
        `Dear ${name},\n\nThank you for your referral!`
      );
      res.send('Referral successfully completed');
    } catch (err) {
      console.error('Error saving referral or sending email:', err);
      res.status(500).send('Internal Server Error');
    }
  });

  app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
}).catch(err => {
  console.error('Error initializing database connection:', err);
});
