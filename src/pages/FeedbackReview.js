import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './FeedbackReview.css';

const feedbackData = {
    appFeedback: [
        {
            email: 'alex.rivera@email.com',
            name: 'Alex Rivera',
            feature: 'Booking Interface',
            message: 'The new booking interface is super intuitive and fast!',
            rating: 5,
        },
        {
            email: 'camila.mendoza@email.com',
            name: 'Camila Mendoza',
            feature: 'Dark Mode',
            message: 'Please add a dark mode option for late-night browsing.',
            rating: 4,
        },
        {
            email: 'daniel.gomez@email.com',
            name: 'Daniel Gomez',
            feature: 'Notifications',
            message: 'I like how timely the trip reminders are!',
            rating: 5,
        }
    ],
    locationFeedback: [
        {
            email: 'jane.santos@email.com',
            name: 'Jane Santos',
            location: 'Casa Manila',
            message: 'The tour was informative and the guide was amazing!',
            rating: 5,
        },
        {
            email: 'vince.reyes@email.com',
            name: 'Vince Reyes',
            location: 'Fort Santiago',
            message: 'Had a great time but it was a bit crowded.',
            rating: 4,
        },
        {
            email: 'marie.lopez@email.com',
            name: 'Marie Lopez',
            location: 'Intramuros',
            message: 'Loved the history and architecture!',
            rating: 5,
        }
    ]
};

const FeedbackReview = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('locationFeedback');

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
    };

    const filteredFeedback = feedbackData[activeTab].filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activeTab === 'appFeedback'
            ? item.feature.toLowerCase()
            : item.location.toLowerCase()
        ).includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <div className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Feedback Overview</h1>
                </div>

                <div className="cards-container">
                    <div className="card brown">
                        <p>Average Rating</p>
                        <h2 style={{ color: 'green' }}>4.6</h2>
                    </div>
                    <div className="card brown">
                        <p>Most Loved Location</p>
                        <h2>Intramuros</h2>
                    </div>
                    <div className="card brown">
                        <p>Area of Concern</p>
                        <h2>Muralla</h2>
                    </div>
                </div>

                <div className="filter-toggle">
                    <button
                        className={activeTab === 'locationFeedback' ? 'active' : ''}
                        onClick={() => handleTabClick('locationFeedback')}
                    >
                        Location Feedback
                    </button>
                    <button
                        className={activeTab === 'appFeedback' ? 'active' : ''}
                        onClick={() => handleTabClick('appFeedback')}
                    >
                        Feature Feedback
                    </button>
                </div>

                <div className="main-content">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by name, email, feature/location, or message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>{activeTab === 'appFeedback' ? 'App Feature' : 'Location'}</th>
                                <th>Feedback</th>
                                <th>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFeedback.length > 0 ? (
                                filteredFeedback.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.email}</td>
                                        <td>{entry.name}</td>
                                        <td>{activeTab === 'appFeedback' ? entry.feature : entry.location}</td>
                                        <td>{entry.message}</td>
                                        <td>{renderStars(entry.rating)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                        No feedback found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeedbackReview;
