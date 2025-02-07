const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');



// Get all notes for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id })
      .sort({ date: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Error fetching notes' });
  }
});

// Create a new note
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, type, audioLength } = req.body;
    
    const newNote = new Note({
      user: req.user.id,
      title,
      content,
      type,
      audioLength,
      date: new Date(),
      isFavorite: false
    });

    const savedNote = await newNote.save();
    res.json(savedNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Error creating note' });
  }
});

// Delete a note
router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const result = await Note.findOneAndDelete({ 
        _id: req.params.id,
        user: req.user.id 
      });
  
      if (!result) {
        return res.status(404).json({ error: 'Note not found' });
      }
  
      res.json({ message: 'Note deleted successfully', deletedNote: result });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Error deleting note' });
    }
  });

// Update note title
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Error updating note' });
  }
});

// Toggle favorite status
router.patch('/:id/favorite', verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.isFavorite = !note.isFavorite;
    const updatedNote = await note.save();
    
    res.json(updatedNote);
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({ error: 'Error toggling favorite status' });
  }
});







// Update note content
router.patch('/:id/content', verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { content: content } },
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Configure multer for memory storage instead of disk
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload image for note
router.post('/:id/images', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Convert buffer to base64
    const imageData = req.file.buffer.toString('base64');
    const contentType = req.file.mimetype;
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + req.file.originalname;

    // Find the note first
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Initialize images array if it doesn't exist
    if (!note.images) {
      note.images = [];
    }

    // Add new image to the images array
    note.images.push({
      data: `data:${contentType};base64,${imageData}`,
      contentType: contentType,
      filename: filename
    });

    // Save the updated note
    await note.save();

    // Return the image data in a format frontend can use
    res.json({
      url: `data:${contentType};base64,${imageData}`,
      filename: filename,
      contentType: contentType
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete image from note
router.delete('/:noteId/images/:filename', verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.noteId, user: req.user.id });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Remove the image if images array exists
    if (note.images) {
      note.images = note.images.filter(img => img.filename !== req.params.filename);
      await note.save();
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;