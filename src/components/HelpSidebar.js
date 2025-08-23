import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HelpSidebar.css";

const HelpSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const links = [
        { path: "/terms", label: "Terms of Service" },
        { path: "/privacy", label: "Privacy Policy" },
        { path: "/faqs", label: "FAQs" },
    ];

    return (
        <div className="help-sidebar">
            <h3 className="sidebar-title">Help & Info</h3>
            <ul className="sidebar-links">
                {links.map((link) => (
                    <li
                        key={link.path}
                        className={`sidebar-link ${location.pathname === link.path ? "active" : ""}`}
                        onClick={() => navigate(link.path)}
                    >
                        {link.label}
                    </li>
                ))}
            </ul>
            <button
                className="back-home-button"
                onClick={() => navigate("/")}
            >
                ← Back to Home
            </button>
        </div>
    );
};

export default HelpSidebar;
