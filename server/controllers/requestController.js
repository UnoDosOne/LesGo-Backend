const Request = require("../models/Request");
const Notification = require("../models/Notification");
const multer = require("multer");
const path = require("path");

const futureTimeStamp = (addNums) => {
  let dateFuture = new Date().setTime(
    new Date().getTime() + addNums * 24 * 60 * 60 * 1000
  );

  return dateFuture;
};

const documentDurationsInSeconds = {
  "Authentication": new Date(futureTimeStamp(14)).toISOString(), // 2 weeks in days
  "CAV (Certification Authentication & Verification)": new Date(
    futureTimeStamp(28)
  ).toISOString(), // 4 weeks in days
  "Correction of Name": new Date(futureTimeStamp(7)).toISOString(), // 1 week in days
  "Diploma Replacement": new Date(futureTimeStamp(21)).toISOString(), // 3 weeks in days
  "Evaluation": new Date(futureTimeStamp(1)).toISOString(), // 1 day in days
  "Permit to study": new Date(futureTimeStamp(2)).toISOString(), // 2 days in days
  "Rush Fee": new Date(futureTimeStamp(3)).toISOString(), // 3 days in days
  "SF 10 ( Form 137 )": new Date(futureTimeStamp(4)).toISOString(), // 4 days in days
  "Transcript of Records": new Date(futureTimeStamp(5)).toISOString(), // 5 days in days
  "Honorable Dismissal": new Date(futureTimeStamp(6)).toISOString(), // 6 days in days
  "Others": "Varies",
};

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads")); // Adjust path if needed
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1048576 }, // 1MB size limit
  fileFilter: function (req, file, cb) {
    const validFileTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (validFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PNG, JPEG, and JPG are allowed."));
    }
  },
}).fields([
  { name: "clearanceFile", maxCount: 1 },
  { name: "authorizationLetter", maxCount: 1 },
  { name: "authorizingPersonID", maxCount: 1 },
  { name: "authorizedPersonID", maxCount: 1 },
  { name: "receiptImage", maxCount: 1 }, // Add this line to recognize "receiptImage"
]);

// Function to handle saving a new request
const saveRequest = async (req, res) => {
  try {
    const {
      client,
      documentType,
      purpose,
      graduationDate,
      semester,
      requestedCredentials,
      clearanceStatus,
      phoneNumber,
      requestedDate,
    } = req.body;

    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ error: "Unauthorized access. User ID is required." });
    }

    const userId = req.user.id;

    if (
      !client ||
      !documentType ||
      !purpose ||
      !graduationDate ||
      !semester ||
      !requestedCredentials ||
      !clearanceStatus ||
      !phoneNumber ||
      requestedDate === undefined
    ) {
      // const newNotification = new Notification({
      //   type: "Rejected",
      //   formType: documentType,
      //   message:
      //     "Rejected, you have invalid files please check and resubmit your requirements and make another request.",
      //   user_id: userId,
      // });

      await newNotification.save();

      return res.status(400).json({ error: "All fields are required" });
    }
    console.log(req.body.requestStatus, "basta mao ni");

    if (req.body.requestStatus === "Rejected") {
      const newNotification = new Notification({
        type: "Rejected",
        formType: documentType,
        message:
          "Rejected, you have invalid files please check and resubmit your requirements and make another request.",
        user_id: userId,
      });

      await newNotification.save();

      return res.status(400).json({ error: "Clearance file is required" });
    }

    const newRequest = new Request({
      userId,
      client,
      documentType,
      purpose,
      graduationDate: graduationDate,
      semester,
      requestedCredentials,
      clearanceStatus,
      phoneNumber,
      requestedDate: new Date(),
      clearanceFile: req.files.clearanceFile
        ? req.files.clearanceFile[0].path
        : null,
      authorizationLetter: req.files.authorizationLetter
        ? req.files.authorizationLetter[0].path
        : null,
      authorizingPersonID: req.files.authorizingPersonID
        ? req.files.authorizingPersonID[0].path
        : null,
      authorizedPersonID: req.files.authorizedPersonID
        ? req.files.authorizedPersonID[0].path
        : null,
      proofOfPayment: req.files.receiptImage
        ? req.files.receiptImage[0].path
        : null, // Use receiptImage here
    });

    const newNotification = new Notification({
      message:
        "Request submitted, We will get back to you as soon as possible!",
      user_id: userId,
      type: "Pending",
      formType: documentType,
    });

    await newNotification.save();
    await newRequest.save();
    res.status(201).json({ message: "Request saved successfully!" });
  } catch (error) {
    console.error("Error saving request:", error);
    res.status(500).json({ error: "Failed to save the request" });
  }
};

// Function to fetch all requests associated with the logged-in user
const getAllRequests = async (req, res) => {
  try {
    // Check if the user ID is set by the auth middleware
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ error: "Unauthorized access. User ID is required." });
    }

    const userId = req.user.id;
    const userType = req.user.userType;

    // Check user type to determine whether to fetch all requests or user-specific requests
    let requests;
    console.log(req.user, "req.user");
    if (userType === "registrar" || userType === "admin") {
      const userCourse = req.user.course;

      // Fetch requests where the user's course matches
      requests = await Request.find()
      .populate({
          path: "userId", // Populate the userId field
          select: "fName email schoolID course acadYear", 
          match: { course: userCourse },
      })
      .exec()
      
    } else {
      // Otherwise, fetch requests specific to the logged-in user
      requests = await Request.find({ userId })
        .populate("userId", "fName email schoolID course acadYear") // Populate user details
        .exec();
    }

    if (!requests || requests.length === 0) {
      return res.status(404).json({ message: "No requests found." });
    }

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params; // Extract the request ID from the URL
    const { requestStatus, dType, userid, rejectItems } = req.body; // Extract the new status and clearedAt from the request body

    const invalidFields = Object.entries(rejectItems)
      .filter(([key, value]) => value === "invalid") // Filter for "invalid" status
      .map(([key]) => key);


      const message = invalidFields.length > 0 
      ? `Rejected, you have invalid files: ${invalidFields.join(', ')}. Please check and resubmit your requirements and make another request.` 
      : "";


    // Validate input
    if (!id || !requestStatus) {
      return res
        .status(400)
        .json({ error: "Request ID and status are required" });
    }

    const result = getDocTypeSec(dType);

    if (requestStatus === "Rejected") {
      const newNotification = new Notification({
        type: "Rejected",
        formType: dType,
        message: message,
        user_id: userid,
      });

      await newNotification.save();
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      id,
      {
        requestStatus: requestStatus,
        queuedAt: result,
        clearedAt: new Date().toISOString(),
        documentType: dType,
      },
      {
        new: true,
      }
    );

    // If the request is not found, return 404
    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Respond with success
    res
      .status(200)
      .json({ message: "Request updated successfully", updatedRequest });
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDocTypeSec = (documentType) => {
  const dateInSeconds = documentDurationsInSeconds[documentType];
  return dateInSeconds;
};

// Function to get the counts of requests based on status
const getRequestCounts = async (req, res) => {
  try {
    // Fetch count of requests with different statuses
    const pendingCount = await Request.countDocuments({
      requestStatus: "Pending",
    });
    const clearedCount = await Request.countDocuments({
      requestStatus: "Cleared",
    });
    const rejectedCount = await Request.countDocuments({
      requestStatus: "Rejected",
    });

    res.status(200).json({
      pending: pendingCount,
      cleared: clearedCount,
      rejected: rejectedCount,
    });
  } catch (error) {
    console.error("Error fetching request counts:", error);
    res.status(500).json({ error: "Failed to fetch request counts" });
  }
};

module.exports = {
  saveRequest,
  upload, // Export multer upload for route handling
  getAllRequests, // Export the new function for fetching requests
  updateRequestStatus,
  getRequestCounts, // Export the new function for fetching request counts
};
