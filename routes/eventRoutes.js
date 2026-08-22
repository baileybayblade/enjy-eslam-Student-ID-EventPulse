const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { validateResult } = require('../middleware/errorHandler');

const eventValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('venue').notEmpty().withMessage('Venue is required'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be a positive number'),
  body('date').isISO8601().withMessage('Date must be a valid ISO format'),
  body('category').isMongoId().withMessage('Category must be a valid ObjectId'),
];

// routes
router.post('/', eventValidationRules, validateResult, eventController.createEvent);
router.patch('/:id', eventValidationRules, validateResult, eventController.updateEvent);

module.exports = router;