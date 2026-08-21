const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// one registration per user per event
registrationSchema.index({ event: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);