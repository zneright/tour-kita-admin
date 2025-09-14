import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import Carousel from '../components/Carousel';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-wrapper">

            {/* Header */}
            <header className="home-header">
                <div className="header-left">
                    <img src={logo} alt="TourKita" className="header-logo" />
                    <span className="header-title">TourKita</span>
                </div>
                <div className="header-right">
                    <button onClick={() => navigate("/faqs")} className="header-link">FAQ</button>
                    <button onClick={() => navigate("/privacy")} className="header-link">Privacy Policy</button>
                    <button onClick={() => navigate('/login')} className="header-button">Admin Login</button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section">
                <Carousel />
                <div className="hero-overlay">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>Discover historical landmarks with AR, live navigation, and interactive guides</p>
                    <div className="hero-cta">
                        <button className="download-btn android">Download for Android</button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2>Why Choose TourKita?</h2>
                <div className="features-cards">
                    <div className="feature-card ar">
                        <h3>Augmented Reality</h3>
                        <p>Bring historical Intramuros sites and people to life with AR.</p>
                    </div>
                    <div className="feature-card nav">
                        <h3>Live Navigation</h3>
                        <p>Get real-time directions to landmarks and hidden gems.</p>
                    </div>
                    <div className="feature-card guide">
                        <h3>Interactive Guides</h3>
                        <p>Learn about locations, restaurants, and events by tapping pins.</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <h2>How TourKita Works</h2>
                <div className="steps-container">
                    {[
                        { icon: "📲", title: "Download the App", desc: "Get TourKita on your mobile to start exploring Intramuros." },
                        { icon: "👤", title: "Sign Up or Guest", desc: "Log in for full features or explore as a guest." },
                        { icon: "🗺️", title: "Explore Landmarks", desc: "Visit historical spots or go straight to AR-supported locations." },
                        { icon: "🔍", title: "Activate AR Camera", desc: "Use AR to see history come alive in real-time." },
                    ].map((step, i) => (
                        <div key={i} className="step-card">
                            <div className="step-icon">{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Partnership Section */}
            <section className="partnership-section">
                <h3>In Partnership With</h3>
                <img
                    src="https://intramuros.gov.ph/wp-content/uploads/2016/11/Logo100x100-1.png"
                    alt="Intramuros Administration Logo"
                    className="partner-logo"
                />
                <p>TourKita collaborates with the Intramuros Administration to bring verified historical experiences.</p>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-left">
                        <img src={logo} alt="TourKita" className="footer-logo" />
                        <p>&copy; {new Date().getFullYear()} TourKita. All rights reserved.</p>
                    </div>
                    <div className="footer-right">
                        <a href="/faqs" className="footer-link">FAQ</a>
                        <a href="https://intramuros.gov.ph" target="_blank" rel="noreferrer" className="footer-link">Intramuros Admin</a>
                        <a href="/privacy" className="footer-link">Privacy Policy</a>
                        <a href="/terms" className="footer-link">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
