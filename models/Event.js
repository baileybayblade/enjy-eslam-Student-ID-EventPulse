const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    city: {
      type: String,
      required: [true, 'City location is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue location is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 spot'],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer reference is required'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'Registered count cannot be negative'],
    },
  },
  { timestamps: true }
);

eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);