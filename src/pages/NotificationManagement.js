import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';
import { db } from '../firebase'; // Import Firestore from your firebaseConfig
import { collection, addDoc } from 'firebase/firestore'; // Firestore functions

const NotificationManagement = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('updates');
    const [audience, setAudience] = useState('all');
    const [schedule, setSchedule] = useState('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [previewVisible, setPreviewVisible] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            alert('Please fill out both the title and message.');
            return;
        }

        const sendTime = schedule === 'now' ? 'immediately' : `on ${scheduledDate} at ${scheduledTime}`;

        // Send notification to Firebase Firestore
        try {
            const docRef = await addDoc(collection(db, 'notifications'), {
                title,
                message,
                category,
                audience,
                schedule: schedule === 'now' ? 'immediately' : `on ${scheduledDate} at ${scheduledTime}`,
                timestamp: new Date(), // Save the timestamp of when the notification was created
            });

            console.log('Notification sent to Firestore with ID: ', docRef.id);
            alert(`Notification sent to ${audience} (${sendTime}) in category: ${category}`);

            // Reset form state after sending the notification
            setTitle('');
            setMessage('');
            setCharCount(0);
            setAudience('all');
            setCategory('updates');
            setSchedule('now');
            setScheduledDate('');
            setScheduledTime('');
            setPreviewVisible(false); // Close preview when notification is sent
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('Error sending notification. Please try again later.');
        }
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

                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="updates">Updates</option>
                        <option value="promotions">Promotions</option>
                        <option value="reminders">Reminders</option>
                        <option value="alerts">Alerts</option>
                    </select>

                    <label htmlFor="audience">Audience</label>
                    <select
                        id="audience"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                    >
                        <option value="all">All Users</option>
                        <option value="registered">Registered Users</option>
                        <option value="guest">Guest Users</option>
                    </select>

                    <label htmlFor="schedule">Send</label>
                    <select
                        id="schedule"
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                    >
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

                            <label htmlFor="time">Select Time</label>
                            <input
                                type="time"
                                id="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                            />
                        </>
                    )}

                    <button
                        type="button"
                        className="preview-btn"
                        onClick={() => setPreviewVisible(!previewVisible)}
                    >
                        {previewVisible ? 'Close Preview' : 'Preview'}
                    </button>
                    <button type="submit" className="send-btn">Send Notification</button>
                </form>

                {previewVisible && (
                    <div className="notification-popup">
                        <div className="popup-content">
                            <h3>Preview</h3>
                            <p><strong>To:</strong> {audience}</p>
                            <p><strong>Category:</strong> {category}</p>
                            <p><strong>Title:</strong> {title}</p>
                            <p><strong>Message:</strong> {message}</p>
                            <p>
                                <strong>Schedule:</strong>{' '}
                                {schedule === 'now' ? 'Immediately' : `Scheduled for ${scheduledDate} at ${scheduledTime}`}
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
