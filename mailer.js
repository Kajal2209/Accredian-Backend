const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const path = require('path');
const fs = require('fs');

const credentialsPath = path.join(__dirname, 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath));

// const credentialsPath = path.join(__dirname, 'etc', 'secrets', 'credentials.json');
// console.log('Using credentials file path:', credentialsPath);  // Debugging line
// const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);

const sendEmail = async (to, subject, text) => {
  oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

  const accessToken = await oAuth2Client.getAccessToken();

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: client_id,
      clientSecret: client_secret,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  };

  return transport.sendMail(mailOptions);
};

module.exports = sendEmail;
