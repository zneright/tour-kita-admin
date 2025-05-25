import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [popupVisible, setPopupVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState('updates');
    const [audience, setAudience] = useState('all');
    const [schedule, setSchedule] = useState('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            const querySnapshot = await getDocs(collection(db, 'notifications'));
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort notifications\
            fetched.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setNotifications(fetched);
        };
        fetchNotifications();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert('Please fill out both the title and message.');
            return;
        }

        setLoading(true);

        try {
            const docRef = await addDoc(collection(db, 'notifications'), {
                title,
                message,
                category,
                audience,
                schedule: schedule === 'now' ? 'immediately' : `on ${scheduledDate} at ${scheduledTime}`,
                timestamp: Timestamp.now(),
            });

            alert(`Notification sent to ${audience}`);

            // rereset ang form
            setTitle('');
            setMessage('');
            setCharCount(0);
            setAudience('all');
            setCategory('updates');
            setSchedule('now');
            setScheduledDate('');
            setScheduledTime('');
            setPopupVisible(false);

            // Refresh after send
            const querySnapshot = await getDocs(collection(db, 'notifications'));
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort notifications
            fetched.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setNotifications(fetched);

        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Failed to send notification.');
        } finally {
            setLoading(false); 
        }
    };

    const handleDelete = async (id) => {
        try {
            // Delete ng notifiation sa firebase
            await deleteDoc(doc(db, 'notifications', id));

            setNotifications(prevNotifications =>
                prevNotifications.filter(notification => notification.id !== id)
            );

            alert('Notification deleted successfully!');
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification.');
        }
    };

    const categoryIcons = {
        updates: '🔔',
        promotions: '🎉',
        reminders: '⏰',
        alerts: '⚠️',
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="notification-header">
                    <h2>Notification Management</h2>
                    <button className="new-notification-btn" onClick={() => setPopupVisible(true)}>
                        + New Notification
                    </button>
                </div>

                <div className="notification-history">
                    <h3>History</h3>
                    <ul className="notification-list">
                        {notifications.map((notif) => {
                            const dateSent = notif.timestamp?.toDate?.().toLocaleString?.() || 'Unknown Date';
                            const icon = categoryIcons[notif.category] || '📢';

                            return (
                                <li key={notif.id} className="notification-item">
                                    <div className="notif-image">
                                        <div className="icon-placeholder">{icon}</div>
                                    </div>
                                    <div className="notif-details">
                                        <strong>{notif.title}</strong>
                                        <p>{notif.message}</p>
                                        <small>{dateSent}</small>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(notif.id)}
                                    >
                                        Delete
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {popupVisible && (
                    <div className="popup-overlay">
                        <div className="notification-popup scrollable-popup">
                            <form className="popup-content" onSubmit={handleSend}>
                                <h3>Create Notification</h3>

                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />

                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    rows="4"
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        setCharCount(e.target.value.length);
                                    }}
                                    maxLength={300}
                                    required
                                />
                                <small>{charCount}/300 characters</small>

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

                                <label htmlFor="schedule">Schedule</label>
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
                                        <label htmlFor="date">Date</label>
                                        <input
                                            type="date"
                                            id="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                        />
                                        <label htmlFor="time">Time</label>
                                        <input
                                            type="time"
                                            id="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                        />
                                    </>
                                )}

                                <div className="popup-actions">
                                    <button type="submit" className="send-btn" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send'}
                                    </button>
                                    <button type="button" className="exit-btn" onClick={() => setPopupVisible(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationManagement;
