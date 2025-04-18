import React from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';

const NotificationManagement = () => {
    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <h2>Notification Management</h2>

                <div className="notification-form">
                    <label htmlFor="title">Title</label>
                    <input type="text" id="title" placeholder="Enter notification title" />

                    <label htmlFor="message">Message</label>
                    <textarea id="message" placeholder="Enter your message..." rows="5"></textarea>

                    <label htmlFor="audience">Audience</label>
                    <select id="audience">
                        <option value="all">All Users</option>
                        <option value="registered">Registered Users</option>
                        <option value="guest">Guest Users</option>
                    </select>

                    <button type="submit" className="send-btn">Send Notification</button>
                </div>
            </main>
        </div>
    );
};

export default NotificationManagement;
