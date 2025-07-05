// waste-recycling-backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// --- Initialize Firebase Admin ---
// Make sure the path to your service account key is correct
try {
    const serviceAccount = require('./firebase-admin-key.json'); // Path to your key file
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK Initialized Successfully.");
} catch (error) {
    console.error("Firebase Admin SDK Initialization Error:", error);
    process.exit(1); // Exit if initialization fails
}
// --- End Firebase Admin Init ---

// --- Initialize Firestore ---
// No separate connection needed, Firestore uses the initialized admin app
const db = admin.firestore();
console.log("Firestore Initialized.");
// --- End Firestore Init ---

const app = express();

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// --- Routes ---
// Define routes AFTER initializing services

// Basic test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running successfully!' });
});

// Image Analysis Route (doesn't directly interact with DB currently)
const analysisRoutes = require('./routes/analysisRoutes');
app.use('/api/analyze', analysisRoutes);

// User Routes (will use Firestore)
const userRoutes = require('./routes/userRoutes'); // We will create this file next
app.use('/api/users', userRoutes);

// Leaderboard Routes (will use Firestore)
const leaderboardRoutes = require('./routes/leaderboardRoutes'); // We will create this file next
app.use('/api/leaderboard', leaderboardRoutes);
// --- End Routes ---

// --- Basic Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});