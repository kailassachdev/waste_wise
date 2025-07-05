// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // To get user and logout
import styles from './ProfilePage.module.css'; // We'll create this CSS module

function ProfilePage() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState(null); // To store data from backend
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user profile data from the backend API when component mounts
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!currentUser) {
                // Should not happen if ProtectedRoute is working, but good practice
                setIsLoading(false);
                setError("Not logged in.");
                return;
            }

            setIsLoading(true);
            setError(null);
            console.log("[ProfilePage] Fetching user profile...");

            try {
                const token = await currentUser.getIdToken(); // Get auth token
                const response = await fetch('http://localhost:5000/api/users/me', { // Call backend API
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' // Optional for GET but good practice
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log("[ProfilePage] Profile data received:", data);
                setUserProfile(data); // Store fetched data in state

            } catch (err) {
                console.error("[ProfilePage] Error fetching profile:", err);
                setError(err.message);
                setUserProfile(null); // Clear profile on error
            } finally {
                setIsLoading(false); // Stop loading
            }
        };

        fetchUserProfile();

    }, [currentUser]); // Re-fetch if currentUser changes (e.g., after login)

    // Handle Logout
    const handleLogout = async () => {
        setError(null); // Clear any previous errors
        try {
            await logout();
            console.log("[ProfilePage] Logout successful");
            navigate('/login'); // Redirect to login after logout
        } catch (err) {
            console.error("Failed to log out:", err);
            setError('Failed to log out. Please try again.');
        }
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className={styles.loading}>Loading profile...</div>;
    }

    return (
        <div className={styles.profileContainer}>
            <h2 className={styles.title}>Your Profile</h2>

            {error && <div className={styles.errorBanner}>{error}</div>}

            {userProfile ? (
                // Display profile information if successfully fetched
                <div className={styles.profileDetails}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Username:</span>
                        <span className={styles.detailValue}>{userProfile.username || 'Not set'}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Email:</span>
                        <span className={styles.detailValue}>{userProfile.email || currentUser?.email}</span> {/* Fallback to currentUser email */}
                    </div>
                     <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Current Score:</span>
                        <span className={`${styles.detailValue} ${styles.scoreValue}`}>{userProfile.score !== undefined ? userProfile.score : 'N/A'} pts</span>
                    </div>
                    {/* Add more profile details here later if needed */}
                </div>
            ) : (
                // Show message if profile data couldn't be loaded (and no error shown)
                !error && <p>Could not load profile information.</p>
            )}

            {/* Logout Button */}
            <div className={styles.actions}>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Logout
                </button>
                {/* Add other actions like 'Edit Profile' or 'Reset Password' later */}
            </div>
        </div>
    );
}

export default ProfilePage;