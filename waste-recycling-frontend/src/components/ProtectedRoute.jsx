// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();
    const location = useLocation(); // Get current location

    // If user is not logged in, redirect them to the /login page
    // Also pass the current location they tried to access in state,
    // so the login page can redirect them back after successful login (optional).
    if (!currentUser) {
        console.log("ProtectedRoute: No user found, redirecting to /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If user is logged in, render the child component they were trying to access
    return children;
}

export default ProtectedRoute;