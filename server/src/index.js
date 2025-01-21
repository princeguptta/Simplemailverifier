require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const EmailVerifier = require('./services/emailVerifier');

const app = express();
const verifier = new EmailVerifier();

// CORS configuration - must be first
app.use(cors({
    origin: ['http://91.208.197.169:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Preflight requests
app.options('*', cors());

// Other middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is running!' });
});

// Email verification route
app.post('/api/verify', async (req, res) => {
    console.log('Verify route hit:', req.body);
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const result = await verifier.verifyEmail(email);
        res.json(result);
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            error: 'Failed to verify email',
            details: error.message 
        });
    }
});

// 404 handler
app.use((req, res) => {
    console.log('404 for route:', req.path);
    res.status(404).json({ error: `Route not found: ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- GET /api/test');
    console.log('- POST /api/verify');
});