import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './FeedbackReview.css';

const feedbackData = [
    {
        email: 'Jane@email.com',
        name: 'Jane Doe',
        subject: 'Casa Manila',
        message: 'Everything was well organized and fun!',
        rating: 5,
    },
    {
        email: 'Jan@email.com',
        name: 'Jan Vince',
        subject: 'Fort Santiago',
        message: 'More snack options next time.',
        rating: 3,
    },
];

const FeedbackReview = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFeedback = feedbackData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStars = (rating) => {
        return '★'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <div className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Feedback Overview</h1>
                    <div className="date-filter">Today ⌄</div>
                </div>

                <div className="cards-container">
                    <div className="card purple">
                        <p>Today's Rating</p>
                        <h2>4.6</h2>
                        <span>+15.03%</span>
                    </div>
                    <div className="card blue">
                        <p>Most Appreciated</p>
                        <h2>Manila Cathedral</h2>
                    </div>
                    <div className="card red">
                        <p>Areas of Concern</p>
                        <h2>None</h2>
                    </div>
                </div>

                <div className="main-content">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by name, email, subject, or feedback..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Subject</th>
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
                                        <td>{entry.subject}</td>
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
