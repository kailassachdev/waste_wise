// src/App.jsx
import { Routes, Route } from 'react-router-dom';

// Components
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

// Pages
import HomePage from './pages/HomePage';
import ScanWastePage from './pages/ScanWastePage';
import DisposalGuidePage from './pages/DisposalGuidePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
// TODO: Import NotFoundPage later

import './App.css';

function App() {
    console.log("App component rendered");

    return (
        <div>
            <Navbar />
            <main>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/scan"
                        element={
                            <ProtectedRoute>
                                <ScanWastePage />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/guide"
                        element={
                            <ProtectedRoute> {/* Decide if guide needs protecting */}
                                <DisposalGuidePage />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/leaderboard"
                        element={
                            <ProtectedRoute>
                                <LeaderboardPage />
                            </ProtectedRoute>
                        }
                    />
                     <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* TODO: Add catch-all route */}
                    {/* <Route path="*" element={<NotFoundPage />} /> */}
                </Routes>
            </main>
        </div>
    );
}

export default App;