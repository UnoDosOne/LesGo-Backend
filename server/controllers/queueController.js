const Queue = require("../models/Queue");
const moment = require("moment");
const Notification = require("../models/Notification");
const { format } = require('date-fns'); 

function getCurrentPeriod() {
  const currentHour = new Date().getHours();
  if (currentHour >= 8 && currentHour < 12) {
    return "AM";
  } else if (currentHour >= 13 && currentHour < 17) {
    return "PM";
  } else {
    return null; // Outside working hours
  }
}

function getNextWorkingDay(date) {
  let nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  // If Sunday (0), skip to Monday
  if (nextDate.getDay() === 0) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  return nextDate;
}

// Function to fetch the queue according to the rules
exports.getQueue = async (req, res) => {
  try {
    const currentPeriod = getCurrentPeriod();

    if (!currentPeriod) {
      return res.status(200).json({ message: "Outside working hours" });
    }

    const todayStart = moment.utc().startOf("day").toISOString();
    const todayEnd = moment.utc().endOf("day").toISOString();

    // Step 1: Find students in the current period who are not completed
    let studentsInQueue = await Queue.find(
      {
        amPm: currentPeriod,
        completed: false,
        date_appointed: { $gte: todayStart, $lte: todayEnd },
      },
      "date_appointed amPm in_queue completed counter tokenNumber firstname lastname course"
    )
      .sort("counter")
      .limit(50);

    // Step 2: If less than 50 students, fill up from those not yet in_queue
    if (studentsInQueue.length < 50) {
      const remainingSlots = 50 - studentsInQueue.length;

      const studentsNotInQueue = await Queue.find(
        {
          in_queue: false,
          completed: false,
          date_appointed: { $gte: todayStart, $lte: todayEnd },
        },
        "date_appointed amPm in_queue completed counter tokenNumber firstname lastname course"
      )
        .sort("counter")
        .limit(remainingSlots);

      // Update their in_queue status to true
      const studentIdsToUpdate = studentsNotInQueue.map(
        (student) => student._id
      );
      await Queue.updateMany(
        { _id: { $in: studentIdsToUpdate } },
        { $set: { in_queue: true, amPm: currentPeriod } }
      );

      // Merge both arrays
      studentsInQueue = studentsInQueue.concat(studentsNotInQueue);
    }

    // Assign token numbers from 1 to n
    for (let i = 0; i < studentsInQueue.length; i++) {
      const student = studentsInQueue[i];
      if (student.tokenNumber !== i + 1) {
        await Queue.updateOne(
          { _id: student._id },
          { $set: { tokenNumber: i + 1 } }
        );
        student.tokenNumber = i + 1; // Update local object
      }
    }

    res.status(200).json(studentsInQueue);
  } catch (error) {
    console.error("Error fetching queue:", error);
    res
      .status(500)
      .json({ message: "Error fetching queue", error: error.message });
  }
};

exports.serveQueue = async (req, res) => {
  const servedId = req.body._id;
  if (!servedId) return res.status(404).json({ message: "Id not found" });
  await Queue.updateOne(
    { _id: servedId },
    { $set: { completed: true, in_queue: false } }
  );
  res.status(200).json({ message: "Service completed" });
};

// Function to add a student to the queue
exports.addToQueue = async (req, res) => {
  try {
    const { studentID, course, firstname, documentType } = req.body;

    // Helper function to calculate future timestamp
    const futureTimeStamp = (daysToAdd) => {
      return new Date(
        Date.now() + daysToAdd * 24 * 60 * 60 * 1000
      ).toISOString();
    };

    // Document durations mapped with corresponding days
    const documentDurationsInSeconds = {
      "Authentication": futureTimeStamp(14), // 2 weeks
      "CAV (Certification Authentication & Verification)": futureTimeStamp(28), // 4 weeks
      "Correction of Name": futureTimeStamp(7), // 1 week
      "Diploma Replacement": futureTimeStamp(21), // 3 weeks
      "Evaluation": futureTimeStamp(1), // 1 day
      "Permit to study": futureTimeStamp(2), // 2 days
      "Rush Fee": futureTimeStamp(3), // 3 days
      "SF 10 (Form 137)": futureTimeStamp(4), // 4 days
      "Transcript of Records": futureTimeStamp(5), // 5 days
      "Honorable Dismissal": futureTimeStamp(6), // 6 days
      "Others": "Varies", // No specific duration
    };

    // Fetch the date for the document type
    const dateInSeconds = documentDurationsInSeconds[documentType];

    // Get the start of the current day (midnight)
    const dateObject = new Date(dateInSeconds);

    // Count the number of students in the queue for today
    const count = await Queue.countDocuments({
      date_appointed: { $gte: dateObject },
    });

    console.log(count, dateObject);

    // Determine AM/PM based on queue count
    const amPm = count <= 50 ? "AM" : "PM";

    // Create the new queue item
    const newQueueItem = new Queue({
      studentID,
      date_appointed: dateInSeconds,
      amPm,
      course,
      firstname,
      in_queue: false,
      completed: false,
      documentType: documentType
    });


    // Helper function to format the date
    const notificationFormatDate = (dateInSeconds) => {
      const formattedDate = format(new Date(dateInSeconds), 'MMMM dd, yyyy');
      return formattedDate;
    };

    const newNotification = new Notification({
      type: "Cleared",
      formType: documentType,
      user_id: studentID,
      message:
        `Cleared, Your requirements are all valid and your request has been cleared. You have been added to the Queue. Your schedule will be on: ${notificationFormatDate(dateInSeconds)}`,
    });

    // Save both queue item and notification concurrently
    await Promise.all([newNotification.save(), newQueueItem.save()]);

    // Respond with success
    res.status(201).json({
      message: "Student added to the queue successfully",
      data: newQueueItem,
    });
  } catch (error) {
    console.error("Error adding to queue:", error);
    res.status(500).json({
      message: "Error adding to queue",
      error: error.message,
    });
  }
};

// Function to handle timer expiry (push student to bottom of the list)
exports.handleTimerExpiry = async (studentId) => {
  try {
    // Set tokenNumber to null (student will be reassigned a new token at next getQueue)
    await Queue.updateOne({ _id: studentId }, { $set: { tokenNumber: null } });
    console.log(
      `Student ${studentId} timer expired, moved to bottom of the list.`
    );
  } catch (error) {
    console.error("Error handling timer expiry:", error);
  }
};

exports.getRecordsList = async (req, res) => {
  const user = req.user;

  console.log(user)

  if (!user) {
    return res.status(404).json({ message: "No Data" });
  }

  const recordsList = await Queue.find({ studentID: user._id });

  res.status(200).json({recordsList,  message: "Data Retrieved" });
};
