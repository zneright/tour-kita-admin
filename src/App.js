// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FeedbackReview from './pages/FeedbackReview';
import NotificationManagement from './pages/NotificationManagement';
import AnalysisReport from './pages/AnalysisReport';
import Login from './pages/LoginPage';
import MarkersManagement from './pages/MarkersManagement';
import HomePage from './pages/HomePage';
import ARManagement from './pages/ARManagement';
import ContentManagement from './pages/ContentManagement';
import FAQScreen from './pages/FAQScreen';
import TermsOfServiceScreen from './pages/TermsOfServicesScreen';
import PrivacyPolicyScreen from './pages/PrivacyPolicyScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/feedback" element={<FeedbackReview />} />
        <Route path="/notification-management" element={<NotificationManagement />} />
        <Route path="/analysis-report" element={<AnalysisReport />} />
        <Route path="/markers-management" element={<MarkersManagement />} />
        <Route path="ar-management" element={<ARManagement />} />
        <Route path="content-management" element={<ContentManagement />} />
        <Route path="faqs" element={<FAQScreen />} />
        <Route path="terms" element={<TermsOfServiceScreen />} />
        <Route path="privacy" element={<PrivacyPolicyScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
