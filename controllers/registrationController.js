const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    register current authenticated user for an event
// @route   POST /api/registrations
exports.registerForEvent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    // ...check if the event even exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // ...prevent duplicate registration
    const existingRegistration = await Registration.findOne({
      user: userId,
      event: eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // ...check capacity rules
    const currentRegistrationCount = await Registration.countDocuments({ event: eventId });
    if (currentRegistrationCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration blocked: Event has reached full capacity.',
      });
    }

    // ...create registration record
    const registration = await Registration.create({
      user: userId,
      event: eventId,
    });

    await registration.populate('event');

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event.',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    get registered events for current user
// @route   GET /api/registrations/my-registrations
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // fetch only this user's registrations + populate full event & category details
    const registrations = await Registration.find({ user: userId }).populate({
      path: 'event',
      populate: { path: 'category' },
    });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an event registration
// @route   DELETE /api/registrations/:id
// @access  Private (Attendee)
const cancelRegistration = asyncHandler(async (req, res, next) => {
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return next(new AppError('Registration record not found', 404));
  }

  // Ensure user owns this registration
  if (registration.user.toString() !== req.user.id) {
    return next(new AppError('Not authorized to cancel this registration', 403));
  }

  // Remove registration record
  await registration.deleteOne();

  // Decrement event's registeredCount
  await Event.findByIdAndUpdate(registration.event, {
    $inc: { registeredCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: 'Registration cancelled successfully',
  });
});