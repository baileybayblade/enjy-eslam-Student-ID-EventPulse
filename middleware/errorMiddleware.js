const { validationResult } = require('express-validator');

// MW to evaluate validation checks and return 422 if invalid
exports.validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// error handling MW
exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // invalid ObjectId/mongoose CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for ${err.path}: ${err.value}`;
  }

  // mongoose dupe key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value entered for ${field}`;
  }

  // safe error output w/o exposing internal database stack traces
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};