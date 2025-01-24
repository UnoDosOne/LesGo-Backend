const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");

module.exports.getNotification = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const token = req.query.token;
  let userId;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    }

    if (!userId) {
      res.status(401).send("Unauthorized");
      return;
    }

    const existingNotifications = await Notification.find({
      user_id: userId,
    }).sort({ createdAt: 1 });

    existingNotifications.forEach((notification) => {
      const customNotification = {
        id: notification._id,
        message: notification.message,
        user_id: notification.user_id,
        formType: notification.formType,
        type: notification.type,
        read: notification.read,
        backup_id: notification.backup_id,
        createdAt: notification.createdAt,
      };
      res.write(`data: ${JSON.stringify(customNotification)}\n\n`);
    });

    const changeStream = Notification.watch();

    changeStream.on("change", (change) => {
      const notification = change.fullDocument;

      if (change.operationType === "insert") {
        const customNotification = {
          id: notification._id,
          message: notification.message,
          user_id: notification.user_id,
          formType: notification.formType,
          type: notification.type,
          read: notification.read,
          backup_id: notification.backup_id,
          createdAt: notification.createdAt,
        };

        res.write(`data: ${JSON.stringify(customNotification)}\n\n`);
      }
    });

    req.on("close", () => {
      changeStream.close();
    });
  } catch (err) {
    console.error("Error in change stream:", err);
    res.status(500).send("Error while streaming notifications.");
  }
};

module.exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.body; // Extract the new status and clearedAt from the request body

    // Validate input
    if (!id) {
      return res.status(400).json({ error: "ID are required" });
    }

    const updatedRequest = await Notification.findByIdAndUpdate(
      id,
      {
        read: true,
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
