const Message = require('../models/Message');

// @desc    Broadcast an announcement to a specific event room and save to DB (Admin Only)
// @route   POST /api/messages/announcement
exports.sendAnnouncement = async (req, res, next) => { 
  try {
    const { eventId, text } = req.body;
    const senderId = req.user._id; // Admin user ID from requireAuth

    // 1. Save announcement to MongoDB using the Message model
    const message = await Message.create({
      event: eventId,
      sender: senderId,
      text,
      createdAt: new Date()
    });

    await message.populate('sender', 'name email');

    // 2. Broadcast live message ONLY to the targeted event room
    const io = req.app.get('io');
    io.to(`event_${eventId}`).emit('newAnnouncement', message);

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted and saved successfully.',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get announcement history for an event (Ordered by time for late attendees)
// @route   GET /api/messages/event/:eventId
exports.getEventMessages = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Fetch messages sorted chronologically (oldest to newest)
    const messages = await Message.find({ event: eventId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};