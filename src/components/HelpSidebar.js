import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./HelpSidebar.css";

const HelpSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);

    const links = [
        { path: "/terms", label: "Terms of Service" },
        { path: "/privacy", label: "Privacy Policy" },
        { path: "/faqs", label: "FAQs" },
    ];

    useEffect(() => {
        if (location.pathname !== "/") setIsOpen(false);
        else setIsOpen(true);
    }, [location.pathname]);

    return (
        <>
            <div className={`help-sidebar ${isOpen ? "open" : "closed"}`}>
                <h3 className="sidebar-title">Help & Info</h3>
                <ul className="sidebar-links">
                    {links.map((link) => (
                        <li
                            key={link.path}
                            className={`sidebar-link ${location.pathname === link.path ? "active" : ""
                                }`}
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
            <button
                className={`toggle-sidebar-btn ${isOpen ? "open-btn" : "closed-btn"}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </button>
        </>
    );
};

export default HelpSidebar;
