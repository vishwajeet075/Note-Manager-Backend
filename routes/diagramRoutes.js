const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = req.file.path; // Path to uploaded image
    console.log("Image received at backend:", imagePath);

    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');

    

    // Delete the file after processing (optional)
    fs.unlinkSync(imagePath);

    res.status(200).json({ extractedText: text });

  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

module.exports = router;
