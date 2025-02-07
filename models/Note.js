const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'audio'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  audioLength: {
    type: String,
    required: function() {
      return this.type === 'audio';
    }
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  images: [{
    data: String,        // Base64 encoded image data
    contentType: String, // MIME type of image
    filename: String     // Original filename
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', NoteSchema);