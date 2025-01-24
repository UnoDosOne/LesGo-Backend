const Record = require('../models/Record'); // Adjust the path if needed

// Function to get the count of completed records
const getCompletedRecordCount = async (req, res) => {
  try {
    // Count documents with `completed: true`
    const count = await Record.countDocuments({ completed: true });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching completed record count:", error);
    res.status(500).json({ error: "Failed to fetch completed record count" });
  }
};

const getallRecords = async (req, res) => {
  try {
    const records = await Record.find();
    res.status(200).json({ records });
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
}

module.exports = { getCompletedRecordCount, getallRecords };
