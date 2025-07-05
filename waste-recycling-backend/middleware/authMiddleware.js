// waste-recycling-backend/middleware/authMiddleware.js
const admin = require('firebase-admin');

// Middleware function to verify Firebase ID token sent from frontend
async function verifyAuthToken(req, res, next) {
    const authHeader = req.headers.authorization; // Expect "Bearer <token>"

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized: No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1]; // Extract the token

    try {
        // Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        // Add decoded user info (uid, email, etc.) to the request object
        // so subsequent route handlers can access it
        req.user = decodedToken;
        console.log(`Authenticated user: ${req.user.uid}`); // Log successful auth
        next(); // Proceed to the actual route handler
    } catch (error) {
        console.error('Error verifying Firebase ID token:', error);
        return res.status(403).send({ message: 'Forbidden: Invalid or expired token.' });
    }
}

module.exports = { verifyAuthToken };