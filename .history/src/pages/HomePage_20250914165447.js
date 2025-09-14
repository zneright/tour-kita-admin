import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import logo from '../assets/TourKitaCropped.jpg';
import Carousel from '../components/Carousel';
import { MapPin, Navigation, Eye, Download, User, Camera } from 'lucide-react';



const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-wrapper">
            <header className="home-header">
                <div className="header-left">
                    <img src={logo} alt="TourKita" className="header-logo" loading="lazy" />
                    <span className="header-title">TourKita</span>
                </div>
                <div className="header-right">
                    <button onClick={() => navigate("/faqs")} className="header-link">FAQ</button>
                    <button onClick={() => navigate("/privacy")} className="header-link">Privacy Policy</button>
                    <button className="header-button" onClick={() => navigate('/login')}>Admin Login</button>
                </div>
            </header>

            <div className="carousel-wrapper">
                <Carousel />
                <div className="hero-overlay animate-fade-in">
                    <h1>Explore Intramuros Like Never Before</h1>
                    <p>With AR, navigation, and historical guides at your fingertips</p>
                </div>

                <div className="download-banner animate-slide-up">
                    <h2>Ready to Explore?</h2>
                    <p>Experience the history of Intramuros like never before with TourKita</p>
                    <div className="download-buttons">
                        <button className="download-btn android">
                            <Download size={16} style={{ marginRight: '6px' }} />
                            Download for Android
                        </button>
                    </div>
                </div>
            </div>

            <section className="info-slides-section">
                <h2>Why Choose TourKita?</h2>
                <div className="info-slides">
                    <div className="info-card ar animate-zoom-in">
                        <MapPin size={32} style={{ marginBottom: '12px' }} />
                        <h4>Augmented Reality</h4>
                        <p>See the past come alive with AR visuals of historical sites and people.</p>
                    </div>
                    <div className="info-card nav animate-zoom-in">
                        <Navigation size={32} style={{ marginBottom: '12px' }} />
                        <h4>Live Navigation</h4>
                        <p>Get directions to landmarks and explore hidden gems around Intramuros.</p>
                    </div>
                    <div className="info-card guide animate-zoom-in">
                        <Eye size={32} style={{ marginBottom: '12px' }} />
                        <h4>Interactive Guides</h4>
                        <p>Tap on pins to learn about places, restaurants, events, and more.</p>
                    </div>
                </div>
            </section>

            <section className="how-tourkita-works">
                <h2 className="tourkita-steps-title">How TourKita Works</h2>
                <div className="tourkita-steps-container">
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">
                            <Download size={24} />
                        </div>
                        <h3>Step 1</h3>
                        <h4>Download the App</h4>
                        <p>Get TourKita on your mobile and start your adventure in Intramuros.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">
                            <User size={24} />
                        </div>
                        <h3>Step 2</h3>
                        <h4>Sign Up or Guest Access</h4>
                        <p>Log in for full features or explore immediately as a guest.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">
                            <MapPin size={24} />

                        </div>
                        <h3>Step 3</h3>
                        <h4>Explore Landmarks</h4>
                        <p>Browse historical spots or go straight to AR-supported locations.</p>
                    </div>
                    <div className="tourkita-step-card">
                        <div className="step-icon-circle">
                            <Camera size={24} />
                        </div>
                        <h3>Step 4</h3>
                        <h4>Activate AR Camera</h4>
                        <p>Use your phone's AR view to see the past come alive in real time.</p>
                    </div>
                </div>
            </section>

            <section className="partnership-section">
                <h3>In Partnership With</h3>
                <img
                    src="https://intramuros.gov.ph/wp-content/uploads/2016/11/Logo100x100-1.png"
                    alt="Intramuros Administration Logo"
                    className="intramuros-logo"
                />
                <p className="partner-name">Intramuros Administration</p>
                <p>TourKita works closely with the Intramuros Administration to bring you verified, culturally rich content and real-time historical experiences.</p>
            </section>

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
