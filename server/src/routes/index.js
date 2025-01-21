// src/routes/index.js
const express = require('express');
const router = express.Router();
const { verifyEmail } = require('../controllers/emailController');

router.post('/verify', verifyEmail);

module.exports = router;