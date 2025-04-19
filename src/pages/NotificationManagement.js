import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';

const NotificationManagement = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('all');
    const [schedule, setSchedule] = useState('now');
    const [charCount, setCharCount] = useState(0);
    const [previewVisible, setPreviewVisible] = useState(false);

    const handleSend = (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert('Please fill out both the title and message.');
            return;
        }

        alert(`Notification sent to ${audience} (${schedule === 'now' ? 'immediately' : 'scheduled'})`);
        setTitle('');
        setMessage('');
        setCharCount(0);
        setAudience('all');
        setSchedule('now');
        setPreviewVisible(false);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <h2>Notification Management</h2>

                <form className="notification-form" onSubmit={handleSend}>
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter notification title"
                    />

                    <label htmlFor="message">Message</label>
                    <textarea
                        id="message"
                        rows="5"
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setCharCount(e.target.value.length);
                        }}
                        placeholder="Enter your message..."
                        maxLength={300}
                    ></textarea>
                    <small className="char-counter">{charCount}/300 characters</small>

                    <label htmlFor="audience">Audience</label>
                    <select id="audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="registered">Registered Users</option>
                        <option value="guest">Guest Users</option>
                    </select>

                    <label htmlFor="schedule">Send</label>
                    <select id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                        <option value="now">Immediately</option>
                        <option value="later">Schedule for Later</option>
                    </select>

                    <button type="button" className="preview-btn" onClick={() => setPreviewVisible(true)}>Preview</button>
                    <button type="submit" className="send-btn">Send Notification</button>
                </form>

                {previewVisible && (
                    <div className="notification-preview">
                        <h3>Preview</h3>
                        <p><strong>To:</strong> {audience}</p>
                        <p><strong>Title:</strong> {title}</p>
                        <p><strong>Message:</strong> {message}</p>
                        <p><strong>Schedule:</strong> {schedule === 'now' ? 'Immediately' : 'Scheduled'}</p>
                    </div>
                )}

                <div className="notification-history">
                    <h3>Recent Notifications</h3>
                    <ul>
                        <li><strong>All Users</strong> Tour Update - “New tours now available!”</li>
                        <li><strong>Registered</strong> Reminder - “Don't forget your upcoming trip.”</li>
                        <li><strong>Guest</strong> Welcome - “Sign up now to unlock more features.”</li>
                    </ul>
                </div>
            </main>
        </div>
    );
};

export default NotificationManagement;
