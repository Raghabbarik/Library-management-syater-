const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Smart Library" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
};

const overdueEmailTemplate = (userName, bookTitle, daysOverdue, fine) => `
  <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:12px;">
    <h2 style="color:#6366f1;">📚 Smart Library - Overdue Notice</h2>
    <p>Dear <strong>${userName}</strong>,</p>
    <p>The book <strong>"${bookTitle}"</strong> is <strong>${daysOverdue} day(s)</strong> overdue.</p>
    <p>Accumulated fine: <strong style="color:#f43f5e;">₹${fine}</strong></p>
    <p>Please return the book at the earliest to avoid further charges.</p>
    <br/>
    <p style="color:#94a3b8;font-size:12px;">Smart Library Management System</p>
  </div>
`;

module.exports = { sendEmail, overdueEmailTemplate };
