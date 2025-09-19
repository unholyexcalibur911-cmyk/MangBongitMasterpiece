// email.js
// This module handles sending emails (e.g., login notifications)

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a login notification email
 * @param {string} to - Recipient email address
 * @param {string} username - Username that logged in
 */
function sendLoginNotification(to, username) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Login Notification",
    text: `User ${username} has logged in.`,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendLoginNotification };
