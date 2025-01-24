const express = require("express");
const router = express.Router();

const {
  getNotification,
  updateNotification,
} = require("../controllers/notifController.js");

router.get("/notifications", getNotification);
router.put("/updateNotification", updateNotification);

module.exports = router;
