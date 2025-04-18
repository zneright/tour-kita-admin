import React from 'react';
import Sidebar from '../components/Sidebar';
import './FeedbackReview.css';

const FeedbackReview = () => {
    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <div className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Overview</h1>
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
                            <tr>
                                <td>Jane@email.com</td>
                                <td>Jane Doe</td>
                                <td>Casa Manila</td>
                                <td>Everything was well organized and fun!</td>
                                <td>★★★★★</td>
                            </tr>
                            <tr>
                                <td>Jan@email.com</td>
                                <td>Jan Vince</td>
                                <td>Fort Santiago</td>
                                <td>More snack options next time.</td>
                                <td>★★★☆☆</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FeedbackReview;
