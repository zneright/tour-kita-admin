import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourkitaLogo.jpg';
import Carousel from '../components/Carousel';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-wrapper">
            <header className="home-header">
                <div className="header-left">
                    <img src={logo} alt="TourKita" className="header-logo" />
                    <span className="header-title">TourKita AR</span>
                </div>
                <div className="header-right">
                    <a href="#faq" className="header-link">FAQ</a>
                    <button className="header-button" onClick={() => navigate('/login')}>
                        Admin Login
                    </button>
                </div>
            </header>

            <div className="carousel-wrapper">
                <Carousel />
                <div className="download-banner">
                    <h2>Ready to Explore?</h2>
                    <p>Experience the history of Intramuros like never before with TourKita AR!</p>
                    <div className="download-buttons">
                        <button className="download-btn android">Download for Android</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;