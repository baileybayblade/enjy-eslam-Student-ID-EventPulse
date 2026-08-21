const Event = require('../models/Event');

// @desc    get all events with filtering, pagination, sorting, and search
// @route   GET /api/events
exports.getEvents = async (req, res, next) => {
  try {
    const { category, city, startDate, endDate, search, sort, page, limit } = req.query;

    let query = {};

    // ...text search across name/title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // ...existing category & city filters
    if (category) {
      query.category = category;
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    // ...date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // ...sorting logic
    let sortOption = {};
    if (sort === 'date') {
      sortOption = { date: 1 };
    } else if (sort === '-date') {
      sortOption = { date: -1 };
    } else if (sort === 'popularity') {
      // sorts by registered attendees count descending
      sortOption = { registeredCount: -1 }; 
    } else {
      sortOption = { createdAt: -1 };
    }

    // ...pagination setup
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const startIndex = (pageNum - 1) * limitNum;

    //gGet total count matching query (for metadata)
    const total = await Event.countDocuments(query);

    // execute paginated query
    const events = await Event.find(query)
      .populate('category')
      .sort(sortOption)
      .skip(startIndex)
      .limit(limitNum);

    // ...response with required metadata
    res.status(200).json({
      success: true,
      count: events.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: events, // returns [] (empty list) if no match found
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new event
// @route   POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an event
// @route   PATCH /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    req.body.organizer = req.user.id; // organizer thing
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};