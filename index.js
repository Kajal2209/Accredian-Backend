const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using mysql2/promise for async/await support
require('dotenv').config();
const sendEmail = require('./mailer');

const app = express();
const PORT = process.env.PORT || 8000; // Use environment variable for port

app.use(cors());
app.use(express.json());

const initializeDbConnection = async () => {
  try {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    console.log('Connected to database');
    return connection;
  } catch (err) {
    console.error('Failed to connect to the database:', err);
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

  app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));
}).catch(err => {
  console.error('Error initializing database connection:', err);
});
