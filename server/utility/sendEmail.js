const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  // Create a transporter
  let transporter = nodemailer.createTransport({
    // Configure your email service here
    service: "Gmail", // For example
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  // Define email options
  let mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
