const Registration = require('../models/Registration');
const Event = require('../models/Event');
const AppError = require('../utils/appError');

// @desc    register current authenticated user for an event
// @route   POST /api/registrations
// @access  priv
exports.registerForEvent = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { eventId } = req.body;

    // 1. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new AppError('Event not found.', 404));
    }

    // prevent duplicate registration (queries attendee)
    const existingRegistration = await Registration.findOne({
      attendee: userId,
      event: eventId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    // check capacity rules
    const currentRegistrationCount = await Registration.countDocuments({ event: eventId });
    if (currentRegistrationCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Registration blocked: Event has reached full capacity.',
      });
    }

    // create registration record (uses 'attendee')
    const registration = await Registration.create({
      attendee: userId,
      event: eventId,
    });

    // increment event's registeredCount
    await Event.findByIdAndUpdate(eventId, {
      $inc: { registeredCount: 1 },
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
// @access  priv
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    // fetch user's registrations using attendee
    const registrations = await Registration.find({ attendee: userId }).populate({
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

// @desc    cancel an event registration
// @route   DELETE /api/registrations/:id
// @access  priv
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return next(new AppError('Registration record not found', 404));
    }

    // ensure user owns this registration !!! (checks 'attendee')
    if (registration.attendee.toString() !== (req.user.id || req.user._id).toString()) {
      return next(new AppError('Not authorized to cancel this registration', 403));
    }

    // remove registration record
    await registration.deleteOne();

    // decrement event's registeredCount
    await Event.findByIdAndUpdate(registration.event, {
      $inc: { registeredCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};