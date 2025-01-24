const Queue = require('../models/Queue');
const jwt = require('jsonwebtoken'); // Use a library like jsonwebtoken for token decoding

// Fetch specific QR data
exports.getQrData = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized: Token is required' });
    }

    const token = authHeader.split(' ')[1]; // Extract token from Authorization header
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Token is required' });
    }

    let decodedToken;
    try {
      decodedToken = jwt.decode(token);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid token: Unable to decode' });
    }

    const id = decodedToken?.id; // Extract `id` from the token
    if (!id) {
      return res.status(400).json({ message: 'Invalid token: id is required' });
    }
    // Query the Queue collection for matching studentID
    const qrData = await Queue.aggregate([
      {
        $project: {
          studentID: 1,
          firstname: 1,
          completed: 1,
          in_queue: 1,
          tokenNumber: 1,
          _id: 0,
        },
      },
      { $match: { studentID: id, 
        completed: false,
        in_queue: true } },
    ]);

    if (qrData.length === 0) {
      return res.status(404).json({ message: 'No matching QR data found' });
    }

    res.json(qrData[0]); // Ensure qrData is a valid JSON object and return the first matching document
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};