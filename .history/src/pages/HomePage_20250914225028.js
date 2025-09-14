import React, { useEffect } from "react";
import Carousel from "../components/Carousel";
import './HomePage.css';

const HomePage = () => {

    useEffect(() => {
        // Example: fade-in on scroll
        const fadeElements = document.querySelectorAll('.fade-in');

        const handleScroll = () => {
            fadeElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight - 100) {
                    el.classList.add('visible');
                }
            });
        };

        window.addEventListener('scroll', handleScroll);

        // Run once in case some elements are already in view
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []); // empty dependency ensures it runs once after mount

    return (
        <div className="home-wrapper">
            <header className="home-header">
                <div className="header-left">
                    <img className="header-logo" src="/logo.png" alt="Logo" />
                    <span className="header-title">TourKita</span>
                </div>
                <div className="header-right">
                    <a className="header-link">Home</a>
                    <a className="header-link">About</a>
                    <button className="header-button">Download</button>
                </div>
            </header>

            <div className="carousel-wrapper">
                <Carousel />
                <div className="hero-overlay">
                    <h1>Explore Intramuros</h1>
                    <p>Augmented reality guided tours and more.</p>
                </div>
            </div>

            <section className="info-slides-section">
                <h2>Features</h2>
                <div className="info-slides">
                    <div className="info-card ar fade-in">AR Tours</div>
                    <div className="info-card nav fade-in">Navigation</div>
                    <div className="info-card guide fade-in">Guides</div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
