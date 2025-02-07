const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const verifyToken = require('../middleware/authMiddleware');

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

module.exports = router;