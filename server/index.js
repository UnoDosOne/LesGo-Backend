require("dotenv").config({ path: "./server/.env" });
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const rateLimit = require("express-rate-limit");
const path = require("path");
const cron = require("node-cron");
const Queue = require("./models/Queue");
const queueRoutes = require("./routes/queueRoutes");
const authRoutes = require("./routes/auth");
const notificationRoutes = require("./routes/notificationRoutes");
const addUserRoutes = require("./routes/addUserRoutes");
const recordsRoutes = require("./routes/recordsRoutes");

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rate limiter middleware to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Serve static files from the uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api", authRoutes); // Adjusted to match your routes
app.use("/api", queueRoutes); // Use queue routes
app.use("/api", notificationRoutes);
app.use("/api", addUserRoutes);
app.use("/api", recordsRoutes); // Include if needed
app.use("/api", require("./routes/requestRoutes")); // Include if needed

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Function to get next working day (excluding Sunday)
function getNextWorkingDay(date) {
  let nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  // If Sunday (0), skip to Monday
  if (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  return nextDate;
}

// Scheduled task to update date_appointed at 5:00 PM every day
cron.schedule("0 17 * * *", async () => {
  try {
    // Get next working day
    const nextWorkingDay = getNextWorkingDay(new Date());

    // Update date_appointed for all uncompleted students
    await Queue.updateMany(
      { completed: false },
      {
        $set: {
          date_appointed: nextWorkingDay,
          amPm: "AM",
          in_queue: false,
          tokenNumber: null,
        },
      }
    );

    console.log(
      "Updated date_appointed for remaining students to the next working day."
    );
  } catch (error) {
    console.error("Error updating date_appointed:", error);
  }
});
