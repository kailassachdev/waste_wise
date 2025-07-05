// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter here
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* Ensure BrowserRouter wraps everything */}
      <AuthProvider>
        <App /> {/* App now has access to AuthContext and BrowserRouter context */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);