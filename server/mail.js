// mail.js
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
    html: `<p>User <b>${username}</b> has logged in.</p>`,
  };

  console.log("EmailJS send params:", {
    to_email: to,
    username,
    company_name: process.env.COMPANY_NAME,
    website_link: process.env.WEBSITE_LINK,
    company_email: process.env.COMPANY_EMAIL,
  });

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to_email);

  return transporter.sendMail(mailOptions).catch((error) => {
    console.error("EmailJS error:", error.text);
  });
}

module.exports = { sendLoginNotification };
