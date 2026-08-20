const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/register
if (authController.register) {
  router.post('/register', authController.register);
}

module.exports = router;