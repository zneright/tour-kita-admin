import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase';

const ProtectedRoute = ({ children }) => {
    const [userChecked, setUserChecked] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCurrentUser(user);
            setUserChecked(true);
        });
        return () => unsubscribe();
    }, []);

    if (!userChecked) return <div>Loading...</div>;

    return currentUser ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
