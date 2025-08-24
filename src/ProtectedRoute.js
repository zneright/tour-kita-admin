// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const [user, loading] = useAuthState(auth);

    if (loading) return <div>Loading...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (adminOnly) {
        const allowedAdminDomain = '@tourkita.com';
        const allowedAdminEmails = ['admin@tourkita.com'];

        if (
            !user.email.endsWith(allowedAdminDomain) &&
            !allowedAdminEmails.includes(user.email)
        ) {
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
