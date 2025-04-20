import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';

const NotificationManagement = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('all');
    const [schedule, setSchedule] = useState('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [previewVisible, setPreviewVisible] = useState(false);

    const handleSend = (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert('Please fill out both the title and message.');
            return;
        }

        const sendTime = schedule === 'now' ? 'immediately' : `on ${scheduledDate}`;
        alert(`Notification sent to ${audience} (${sendTime})`);

        setTitle('');
        setMessage('');
        setCharCount(0);
        setAudience('all');
        setSchedule('now');
        setScheduledDate('');
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

                    {schedule === 'later' && (
                        <>
                            <label htmlFor="date">Select Date</label>
                            <input
                                type="date"
                                id="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                            />
                        </>
                    )}

                    <button type="button" className="preview-btn" onClick={() => setPreviewVisible(true)}>
                        Preview
                    </button>
                    <button type="submit" className="send-btn">Send Notification</button>
                </form>

                {previewVisible && (
                    <div className="notification-popup">
                        <div className="popup-content">
                            <h3>Preview</h3>
                            <p><strong>To:</strong> {audience}</p>
                            <p><strong>Title:</strong> {title}</p>
                            <p><strong>Message:</strong> {message}</p>
                            <p>
                                <strong>Schedule:</strong>{' '}
                                {schedule === 'now' ? 'Immediately' : `Scheduled for ${scheduledDate}`}
                            </p>

                            <div className="popup-actions">
                                <button className="exit-btn" onClick={() => setPreviewVisible(false)}>Exit</button>
                                <button className="send-btn" onClick={handleSend}>Post</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationManagement;
