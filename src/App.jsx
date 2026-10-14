import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PortalPage from './PortalPage';
import AdminPage from './AdminPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public News Portal */}
        <Route path="/" element={<PortalPage />} />
        
        {/* Strictly Isolated Admin Route */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
