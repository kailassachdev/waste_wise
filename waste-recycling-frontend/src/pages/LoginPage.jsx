// src/pages/LoginPage.jsx
import React, { useState, useRef, useEffect } from 'react'; // Ensure useEffect is imported
import { useAuth } from '../context/AuthContext'; // Import the hook
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Import useLocation
import styles from './AuthForm.module.css'; // Use the same shared CSS module

function LoginPage() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const { login, currentUser } = useAuth(); // Get login and currentUser
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Hook for programmatic navigation
    const location = useLocation(); // Get location object

    // Determine where to redirect after login (from protected route state or default to home)
    const from = location.state?.from?.pathname || "/";

    // Redirect away from login page if user is already logged in
    useEffect(() => {
        // --- Debug Logs ---
        console.log("[LoginPage useEffect] Fired. currentUser:", currentUser ? currentUser.uid : null);
        if (currentUser) {
            console.log(`[LoginPage useEffect] User ${currentUser.uid} exists, navigating to ${from}`);
            navigate(from, { replace: true }); // Redirect to intended page or home
        } else {
            console.log("[LoginPage useEffect] No current user, staying on login page.");
        }
        // --- End Debug Logs ---
    }, [currentUser, navigate, from]); // Dependencies for the effect

    // Handle form submission for login
    async function handleSubmit(e) {
        e.preventDefault(); // Prevent default form submission

        // Basic validation (optional, can add more)
        if (!emailRef.current.value || !passwordRef.current.value) {
             return setError("Please enter both email and password.");
        }

        try {
            setError(''); // Clear previous errors
            setLoading(true); // Set loading state
            await login(emailRef.current.value, passwordRef.current.value);
            console.log("Login successful! Attempting to redirect to:", from);
            // Redirect happens via the useEffect hook now, but we could navigate here too
            // For consistency, let the useEffect handle post-login redirect based on currentUser update
            // navigate(from, { replace: true }); // Removed direct navigation from here
        } catch (err) {
            console.error("Login Error:", err);
            // Provide more user-friendly errors based on Firebase error codes
             if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                 setError('Invalid email or password.');
             } else {
                setError('Failed to log in. Please try again.');
             }
        } finally {
            setLoading(false); // Reset loading state regardless of success/failure
        }
    }

    // Render the login form
    return (
        <div className={styles.authContainer}>
             <div className={styles.authCard}>
                <h2 className={styles.title}>Log In</h2>
                {/* Display error messages */}
                {error && <div className={styles.errorBanner}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" ref={emailRef} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" ref={passwordRef} required />
                    </div>
                     {/* Optional: Add 'Forgot Password?' link here later */}
                    {/* Login button, disabled while loading */}
                    <button disabled={loading} className={styles.submitButton} type="submit">
                         {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
                {/* Link to Signup page */}
                <div className={styles.switchLink}>
                    Need an account? <Link to="/signup">Sign Up</Link>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;