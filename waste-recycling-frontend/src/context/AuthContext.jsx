// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig'; // Import initialized auth

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context easily
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state for initial auth check
    console.log("AuthProvider rendering. Loading:", loading, "User:", currentUser?.uid);
    // --- Firebase Auth Functions ---
    function signup(email, password) {
        // Returns a promise
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        // Returns a promise
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        // Returns a promise
        return signOut(auth);
    }

    // --- Auth State Listener ---
    useEffect(() => {
        console.log("AuthProvider useEffect Mounting."); 
        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user); // Set user to null if logged out, or user object if logged in
            setLoading(false); // Finished initial check
            console.log("onAuthStateChanged fired. User:", user ? user.uid : null, "Setting loading to false.");
        });

        // Cleanup function to unsubscribe when component unmounts
        return () => {
            console.log("AuthProvider useEffect Cleanup (unsubscribing)."); // Log unmount
            unsubscribe();
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Value provided by the context
    const value = {
        currentUser,
        signup,
        login,
        logout
    };

    // Render children only when not loading (avoids rendering protected routes prematurely)
    // Pass the value to consuming components
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}