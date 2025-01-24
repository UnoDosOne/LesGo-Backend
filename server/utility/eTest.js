require('dotenv').config({ path: '../.env' });

const sendEmail = require('./sendEmail'); // Adjust path to your email utility

(async () => {
  try {
    await sendEmail(
      "kyleraygt500@gmail.com", // Replace with a valid email
      "Test Email",
      "This is a test email from the account activation setup."
    );
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

})();
