// waste-recycling-backend/routes/userRoutes.js
const express = require('express');
const admin = require('firebase-admin'); // Use admin SDK for Firestore access
const { verifyAuthToken } = require('../middleware/authMiddleware'); // Import auth middleware

const router = express.Router();
const db = admin.firestore(); // Get Firestore instance

// --- Endpoint to Add Points to Logged-in User ---
// PATH: POST /api/users/me/score
// Requires: Valid Firebase ID Token in Authorization header
// Body: { "points": number }
router.post('/me/score', verifyAuthToken, async (req, res) => {
    const usersCollection = db.collection('users');
    const firebaseUid = req.user.uid; // Get UID from verified token
    const pointsToAdd = parseInt(req.body.points, 10);

    // Validate input points
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
        return res.status(400).json({ message: 'Invalid points value provided.' });
    }

    // Get a reference to the user's document (using their UID as the document ID)
    const userRef = usersCollection.doc(firebaseUid);

    try {
        // Use Firestore's atomic increment operation within a set command
        // with merge:true to handle both new and existing users (upsert)
        await userRef.set({
            score: admin.firestore.FieldValue.increment(pointsToAdd), // Atomically adds points
            email: req.user.email || null, // Store/update email from token
            // Generate a default username if needed, or use one from token if available
            username: req.user.username || (req.user.email ? req.user.email.split('@')[0] : firebaseUid),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp() // Track last update time
        }, { merge: true }); // merge:true creates doc if not exists, updates if exists

        console.log(`Added ${pointsToAdd} points for user ${firebaseUid}`);
        // Note: set/update doesn't return the new score directly.
        // Frontend usually updates its local state based on success.
        res.status(200).json({ message: 'Score updated successfully.' });

    } catch (error) {
        console.error(`Error updating score for user ${firebaseUid}:`, error);
        res.status(500).json({ message: 'Failed to update score.' });
    }
});

// --- Endpoint to Get Logged-in User's Profile ---
// PATH: GET /api/users/me
// Requires: Valid Firebase ID Token
router.get('/me', verifyAuthToken, async (req, res) => {
    const userRef = db.collection('users').doc(req.user.uid);
    try {
        const docSnap = await userRef.get(); // Get the user document snapshot

        if (docSnap.exists) {
            // Send back the user data if document exists
            res.status(200).json({ id: docSnap.id, ...docSnap.data() });
        } else {
            // Optional: Auto-create a basic profile if it doesn't exist on first fetch
             console.log(`Profile not found for ${req.user.uid}, creating basic profile.`);
             const basicProfile = {
                 email: req.user.email || null,
                 username: req.user.username || (req.user.email ? req.user.email.split('@')[0] : req.user.uid),
                 score: 0, // Start with score 0
                 createdAt: admin.firestore.FieldValue.serverTimestamp()
             };
             await userRef.set(basicProfile); // Create the document
             // Send back the newly created profile
             res.status(200).json({ id: req.user.uid, ...basicProfile, score: 0 }); // Explicitly return score 0

             // Alternative: Just return 404 if you don't want auto-creation
             // res.status(404).json({ message: 'User profile not found.' });
        }
    } catch (error) {
         console.error(`Error fetching profile for user ${req.user.uid}:`, error);
        res.status(500).json({ message: 'Failed to fetch user profile.' });
    }
});

module.exports = router;