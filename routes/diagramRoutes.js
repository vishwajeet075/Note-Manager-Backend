const axios = require('axios');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path;

    // Prepare FormData for FastAPI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath), { filename: req.file.originalname });

    // Send to FastAPI
    const fastapiResponse = await axios.post('https://study-section.onrender.com/process-image/', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Delete file after processing
    fs.unlinkSync(imagePath);

    // Send response from FastAPI back to frontend
    res.json(fastapiResponse.data);

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

module.exports = router;
