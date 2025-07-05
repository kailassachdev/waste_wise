// src/components/Navbar/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext'; // Import useAuth

function Navbar() {
    const { currentUser, logout } = useAuth(); // Get currentUser and logout function
    const navigate = useNavigate();

    // Handle the logout action
    const handleLogout = async () => {
        try {
            await logout();
            console.log("Logout successful");
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error("Failed to log out:", error);
            // Optionally show an error message to the user
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContainer}>
                {/* Logo/Brand */}
                <Link to="/" className={styles.navBrand}>
                    RecycleApp
                </Link>

                {/* Navigation links */}
                <ul className={styles.navList}>
                    {/* Links visible to everyone */}
                    <li className={styles.navItem}>
                        <Link to="/" className={styles.navLink}>
                            Home
                        </Link>
                    </li>
                     <li className={styles.navItem}>
                        <Link to="/guide" className={styles.navLink}>
                            Disposal Guide
                        </Link>
                    </li>

                    {/* Conditional Links based on Auth State */}
                    {currentUser ? (
                        // User is Logged IN
                        <> {/* Use React Fragment to group elements */}
                            <li className={styles.navItem}>
                                <Link to="/scan" className={styles.navLink}>
                                    Scan Waste
                                </Link>
                            </li>
                            <li className={styles.navItem}>
                                <Link to="/leaderboard" className={styles.navLink}>
                                    Leaderboard
                                </Link>
                            </li>
                            <li className={styles.navItem}>
                                <Link to="/profile" className={styles.navLink}>
                                    Profile
                                </Link>
                            </li>
                            <li className={styles.navItem}>
                                {/* Logout Button */}
                                <button onClick={handleLogout} className={styles.navButton}>
                                    Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        // User is Logged OUT
                        <> {/* Use React Fragment */}
                            <li className={styles.navItem}>
                                <Link to="/login" className={styles.navLink}>
                                    Login
                                </Link>
                            </li>
                            <li className={styles.navItem}>
                                <Link to="/signup" className={styles.navLink}>
                                    Sign Up
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}

export default Navbar;