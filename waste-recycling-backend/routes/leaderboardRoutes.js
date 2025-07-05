// waste-recycling-backend/routes/leaderboardRoutes.js
const express = require('express');
const admin = require('firebase-admin'); // Use admin SDK

const router = express.Router();
const db = admin.firestore(); // Get Firestore instance
const LEADERBOARD_LIMIT = 10; // How many top users to display

// --- Endpoint to Get Leaderboard ---
// PATH: GET /api/leaderboard
// Requires: No specific authentication needed to VIEW leaderboard (adjust if needed)
router.get('/', async (req, res) => {
    const usersCollection = db.collection('users');

    try {
        // Query Firestore: Order users by score descending, limit the result
        const querySnapshot = await usersCollection
            .orderBy('score', 'desc') // Sort high to low
            .limit(LEADERBOARD_LIMIT) // Get top N users
            .get(); // Execute the query

        const leaders = [];
        // Iterate over the documents in the query result
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Push relevant data for the leaderboard display
            leaders.push({
                firebaseUid: doc.id, // The document ID is the Firebase UID
                // Use stored username, fallback to UID if username doesn't exist
                username: data.username || doc.id,
                score: data.score || 0, // Default to 0 if score field is missing
            });
        });

         // Add rank based on the sorted order
        const rankedLeaders = leaders.map((user, index) => ({
            ...user,
            rank: index + 1, // Rank starts at 1
        }));

        res.status(200).json(rankedLeaders); // Send the ranked list

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Failed to fetch leaderboard data.' });
    }
});

module.exports = router;