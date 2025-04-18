// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FeedbackReview from './pages/FeedbackReview';
import NotificationManagement from './pages/NotificationManagement';
import AnalysisReport from './pages/AnalysisReport';
import Login from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/feedback" element={<FeedbackReview />} />
        <Route path="/notification-management" element={<NotificationManagement />} />
        <Route path="/analysis-report" element={<AnalysisReport />} />
      </Routes>
    </Router>
  );
}

export default App;
