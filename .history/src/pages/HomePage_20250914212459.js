import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import heroImg from '../assets/hero-image.jpg';

const HomePage = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 80);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="home-wrapper">
            {/* Header */}
            <header className={`home-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-left">
                    <img src={logo} alt="TourKita Logo" className="header-logo" />
                    <div className="header-title">TourKita</div>
                </div>
                <div className="header-right">
                    <div className="header-link" onClick={() => navigate('/about')}>About</div>
                    <div className="header-link" onClick={() => navigate('/features')}>Features</div>
                    <div className="header-link" onClick={() => navigate('/contact')}>Contact</div>
                    <button className="header-button" onClick={() => navigate('/signup')}>Get Started</button>
                </div>
            </header>

            {/* Hero */}
            <div className="carousel-wrapper">
                <img src={heroImg} alt="Hero" className="carousel-image" />
                <div className="hero-overlay">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>Augmented Reality tours and interactive maps for the modern traveler.</p>
                </div>
                <div className="download-banner">
                    <h2>Get the App</h2>
                    <p>Download now on iOS or Android</p>
                    <div className="download-buttons">
                        <button className="download-btn">App Store</button>
                        <button className="download-btn">Google Play</button>
                    </div>
                </div>
            </div>

            {/* Info Slides */}
            <section className="info-slides-section">
                <h2>Features</h2>
                <div className="info-slides">
                    <div className="info-card ar">
                        <h4>Augmented Reality</h4>
                        <p>Experience historical sites come to life in 3D AR.</p>
                    </div>
                    <div className="info-card nav">
                        <h4>Interactive Maps</h4>
                        <p>Navigate Intramuros with easy-to-use interactive maps.</p>
                    </div>
                    <div className="info-card guide">
                        <h4>Personal Guides</h4>
                        <p>Get guided tours with historical insights and trivia.</p>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className="how-tourkita-works">
                <div className="tourkita-steps-title">How TourKita Works</div>
                <div className="tourkita-steps-container">
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">1</div>
                        <h4>Open App</h4>
                        <p>Launch the TourKita app to start your adventure.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">2</div>
                        <h4>Choose Destination</h4>
                        <p>Select the location you want to explore from the map.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">3</div>
                        <h4>Experience AR</h4>
                        <p>See historical landmarks in AR and get interactive guides.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <img src={logo} alt="Logo" className="footer-logo" />
                        <p>&copy; 2025 TourKita. All Rights Reserved.</p>
                    </div>
                    <div className="footer-right">
                        <a href="/privacy" className="footer-link">Privacy Policy</a>
                        <a href="/terms" className="footer-link">Terms of Service</a>
                        <a href="/contact" className="footer-link">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
