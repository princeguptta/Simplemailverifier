// src/controllers/emailController.js
const EmailVerifier = require('../services/emailVerifier');
const verifier = new EmailVerifier();

exports.verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: 'Email is required'
            });
        }

        const result = await verifier.verifyEmail(email);
        res.json(result);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            error: 'Failed to verify email',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};