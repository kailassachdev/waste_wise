// src/pages/SignupPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Import the hook
import { useNavigate, Link } from 'react-router-dom'; // For redirection and linking
import styles from './AuthForm.module.css'; // We'll create this shared CSS module

function SignupPage() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup, currentUser } = useAuth(); // Get the signup function from context
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // Hook for programmatic navigation

    useEffect(() => {
        if (currentUser) {
            console.log("User already logged in, redirecting from auth page...");
            navigate('/'); // Redirect to home if user is already logged in
        }
    }, [currentUser, navigate]); // Re-run if currentUser or navigate changes

    async function handleSubmit(e) {
        e.preventDefault(); // Prevent form from refreshing the page

        // Basic validation
        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }
        if (passwordRef.current.value.length < 6) {
             return setError('Password should be at least 6 characters');
        }

        try {
            setError(''); // Clear previous errors
            setLoading(true); // Set loading state
            await signup(emailRef.current.value, passwordRef.current.value);
            console.log("Signup successful!");
            navigate('/'); // Redirect to homepage after successful signup
            // Or navigate('/profile') if you prefer
        } catch (err) {
            console.error("Signup Error:", err);
            // Provide more user-friendly errors if possible
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use. Try logging in.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else {
                setError('Failed to create an account. Please try again.');
            }
        } finally {
             setLoading(false); // Reset loading state
        }
    }

    return (
        <div className={styles.authContainer}>
            <div className={styles.authCard}>
                <h2 className={styles.title}>Sign Up</h2>
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
                    <div className={styles.inputGroup}>
                        <label htmlFor="password-confirm">Confirm Password</label>
                        <input type="password" id="password-confirm" ref={passwordConfirmRef} required />
                    </div>
                    <button disabled={loading} className={styles.submitButton} type="submit">
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
                <div className={styles.switchLink}>
                    Already have an account? <Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;