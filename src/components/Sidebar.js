import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import TourkitaLogo from './TourkitaLogo.jpg';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-top">
                <div className="admin-info">
                    <img
                        src="https://via.placeholder.com/30"
                        alt="Admin"
                        className="admin-avatar"
                    />
                    <span className="admin-text">Admin</span>
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                    <NavLink to="/user-management" className="nav-link">User Management</NavLink>
                    <NavLink to="/feedback" className="nav-link">Feedback & Review</NavLink>
                    <NavLink to="/notification-management" className="nav-link">Notification Management</NavLink>
                    <NavLink to="/analysis-report" className="nav-link">Analysis & Reports</NavLink>
                    <button onClick={handleLogout} className="nav-link logout-button">Log Out</button>
                </nav>
            </div>

            <div className="logo-wrapper">
                <img src={TourkitaLogo} alt="Tour Kita Logo" className="app-logo" />
            </div>
        </div>
    );
};

export default Sidebar;
