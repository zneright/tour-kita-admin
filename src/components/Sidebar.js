import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import TourkitaLogo from './TourkitaLogo.jpg';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { FaMapMarkerAlt, FaTachometerAlt, FaUsers, FaComments, FaBell, FaChartBar } from 'react-icons/fa';



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
                    <FaUserCircle className="admin-icon" />
                    <div>
                        <span className="admin-name">Admin</span>
                    </div>
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className="nav-link">
                        <FaTachometerAlt className="nav-icon" />
                        Dashboard
                    </NavLink>
                    <NavLink to="/user-management" className="nav-link">
                        <FaUsers className="nav-icon" />
                        User Management
                    </NavLink>
                    <NavLink to="/feedback" className="nav-link">
                        <FaComments className="nav-icon" />
                        Feedback & Review
                    </NavLink>
                    <NavLink to="/notification-management" className="nav-link">
                        <FaBell className="nav-icon" />
                        Notification Management
                    </NavLink>
                    <NavLink to="/markers-management" className="nav-link">
                        <FaMapMarkerAlt className="nav-icon" />
                        Markers Management
                    </NavLink>
                    <NavLink to="/analysis-report" className="nav-link">
                        <FaChartBar className="nav-icon" />
                        Analysis & Reports
                    </NavLink>


                </nav>


                <button onClick={handleLogout} className="logout-button">
                    <FaSignOutAlt className="logout-icon" />
                    Log Out
                </button>
            </div>

            <div className="logo-wrapper">
                <img src={TourkitaLogo} alt="Tour Kita Logo" className="app-logo" />
            </div>
        </div>
    );
};

export default Sidebar;
