const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();
const sendEmail = require('./mailer');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to database');
});

app.post('/api/refer-check', (req, res) => {
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

  const sql = 'INSERT INTO refer (name, email, referral_code) VALUES (?, ?, ?)';
  db.query(sql, [name, email, referral_code], async (err, result) => {
    if (err) throw err;

    try {
      await sendEmail(
        email,
        'Referral Confirmation',
        `Dear ${name},\n\nThank you for your referral!`
      );
      res.send('Referral successfully completed');
    } catch (emailError) {
      console.error(emailError);
      res.status(500).send('Referral saved, but failed to send email');
    }
  });
});

app.listen(PORT, () => console.log(`Server started at PORT: ${PORT}`));
