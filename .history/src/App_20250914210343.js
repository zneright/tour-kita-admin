import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./c";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import FeedbackReview from './pages/FeedbackReview';
import NotificationManagement from './pages/NotificationManagement';
import AnalysisReport from './pages/AnalysisReport';
import Login from './pages/LoginPage';
import MarkersManagement from './pages/MarkersManagement';
import HomePage from './pages/HomePage';
import ARManagement from './pages/ArManagement';
import ContentManagement from './pages/ContentManagement';
import FAQScreen from './pages/FAQScreen';
import TermsOfServiceScreen from './pages/TermsOfServicesScreen';
import PrivacyPolicyScreen from './pages/PrivacyPolicyScreen';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/faqs" element={<FAQScreen />} />
          <Route path="/terms" element={<TermsOfServiceScreen />} />
          <Route path="/privacy" element={<PrivacyPolicyScreen />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><FeedbackReview /></ProtectedRoute>} />
          <Route path="/notification-management" element={<ProtectedRoute><NotificationManagement /></ProtectedRoute>} />
          <Route path="/analysis-report" element={<ProtectedRoute><AnalysisReport /></ProtectedRoute>} />
          <Route path="/markers-management" element={<ProtectedRoute><MarkersManagement /></ProtectedRoute>} />
          <Route path="/ar-management" element={<ProtectedRoute><ARManagement /></ProtectedRoute>} />
          <Route path="/content-management" element={<ProtectedRoute><ContentManagement /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
