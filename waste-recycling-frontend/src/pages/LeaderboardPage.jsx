// src/pages/LeaderboardPage.jsx
import React, { useState, useEffect } from 'react'; // <<< Correctly import useState AND useEffect
import styles from './LeaderboardPage.module.css';
// import { useAuth } from '../context/AuthContext'; // Keep commented unless needed for highlighting user

function LeaderboardPage() {
    // --- State Variables ---
    const [leaders, setLeaders] = useState([]);        // Stores the fetched leaderboard data, start empty
    const [isLoading, setIsLoading] = useState(true); // Tracks loading state, start true
    const [error, setError] = useState(null);         // Stores any fetch errors
    // const { currentUser } = useAuth(); // Get current user later if needed for highlighting

    // --- Fetch Leaderboard Data Effect ---
    // This useEffect hook runs once when the component mounts due to the empty `[]` dependencies.
    useEffect(() => {
        // Log when the effect hook itself starts execution
        console.log("[LeaderboardPage useEffect] Running effect hook.");

        // Define the async function that will fetch the data
        const fetchLeaderboard = async () => {
            console.log("[LeaderboardPage fetchLeaderboard] Starting fetch..."); // Log when fetch attempt begins

            // Set initial state for this fetch attempt
            setIsLoading(true);
            setError(null);
            // Optional: Clear previous leaders if you want a refresh effect
            // setLeaders([]);

            try {
                // Define the API endpoint URL
                const apiUrl = 'http://localhost:5000/api/leaderboard'; // Ensure port and path are correct
                console.log(`[LeaderboardPage fetchLeaderboard] Fetching from: ${apiUrl}`);

                // Make the fetch request
                const response = await fetch(apiUrl);

                // Check if the response status indicates an error
                if (!response.ok) {
                    // Try to parse error details from response, provide fallback
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                    console.error("[LeaderboardPage fetchLeaderboard] Fetch failed with status:", response.status, "Data:", errorData);
                    // Throw an error to be caught by the catch block
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }

                // Parse the successful JSON response
                const data = await response.json();
                console.log("[LeaderboardPage fetchLeaderboard] Data fetched successfully:", data);
                setLeaders(data); // Update the state with the fetched leaders

            } catch (err) {
                // Handle any errors during the fetch process
                console.error("[LeaderboardPage fetchLeaderboard] Error during fetch:", err);
                setError(err.message); // Store the error message
                setLeaders([]); // Ensure leaders array is empty on error
            } finally {
                // This block runs regardless of success or error
                console.log("[LeaderboardPage fetchLeaderboard] Fetch attempt complete, setting loading to false.");
                setIsLoading(false); // Set loading to false
            }
        };

        fetchLeaderboard(); // Execute the fetch function

        // No cleanup function needed for this simple fetch, but could return one for AbortController etc.
    }, []); // <<< Empty dependency array ensures this runs only ONCE on component mount

    // --- Component Render Logic ---
    // Log the state just before rendering
    console.log("[LeaderboardPage] Rendering component. isLoading:", isLoading, "error:", error, "leaders count:", leaders.length);

    return (
        <div className={styles.leaderboardContainer}>
            <h2 className={styles.title}>Leaderboard</h2>
            <p className={styles.subtitle}>See who's leading the recycling efforts!</p>

            <div className={styles.listWrapper}>
                {/* Display Loading Message */}
                {isLoading && <p className={styles.loading}>Loading leaderboard...</p>}

                {/* Display Error Message */}
                {!isLoading && error && <p className={styles.error}>Error: {error}</p>}

                {/* Display Leaderboard Data (only if not loading and no error) */}
                {!isLoading && !error && (
                    <>
                        {/* Header Row */}
                        <div className={`${styles.leaderboardItem} ${styles.header}`}>
                            <span className={`${styles.rank} ${styles.headerItem}`}>Rank</span>
                            <span className={`${styles.name} ${styles.headerItem}`}>User</span>
                            <span className={`${styles.score} ${styles.headerItem}`}>Score</span>
                        </div>

                        {/* List of Leaders */}
                        {leaders.length > 0 ? (
                            leaders.map((leader) => (
                                <div
                                    key={leader.firebaseUid} // Use a unique key, firebaseUid is good
                                    className={`${styles.leaderboardItem} ${ // Apply conditional styles for top ranks
                                        leader.rank === 1 ? styles.firstPlace : ''
                                    } ${leader.rank === 2 ? styles.secondPlace : ''} ${
                                        leader.rank === 3 ? styles.thirdPlace : ''
                                    }`}
                                >
                                    <span className={styles.rank}>{leader.rank}</span>
                                    <span className={styles.name}>{leader.username}</span>
                                    <span className={styles.score}>{leader.score} pts</span>
                                </div>
                            ))
                        ) : (
                            // Message if leaderboard is empty but loaded successfully
                            <p className={styles.noData}>Leaderboard is empty.</p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default LeaderboardPage;