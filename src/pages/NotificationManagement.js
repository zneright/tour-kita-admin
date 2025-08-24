import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    Timestamp
} from 'firebase/firestore';

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [adminReplies, setAdminReplies] = useState([]);
    const [activeTab, setActiveTab] = useState('notifications');

    const [searchTermNotif, setSearchTermNotif] = useState('');
    const [searchTermReply, setSearchTermReply] = useState('');

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

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [modalImageUrl, setModalImageUrl] = useState(null);
    const [loadingNotifs, setLoadingNotifs] = useState(true);
    const [loadingReplies, setLoadingReplies] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoadingNotifs(true);
            const querySnapshot = await getDocs(collection(db, 'notifications'));
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            fetched.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
            setNotifications(fetched);
            setLoadingNotifs(false);
        };

        const fetchAdminReplies = async () => {
            setLoadingReplies(true);
            const snapshot = await getDocs(collection(db, 'adminMessages'));
            const replies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            replies.sort((a, b) => b.sentAt.toDate() - a.sentAt.toDate());
            setAdminReplies(replies);
            setLoadingReplies(false);
        };

        fetchNotifications();
        fetchAdminReplies();
    }, []);

    const handleImageUpload = async () => {
        if (!imageFile) return null;

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('upload_preset', 'Notification Image');

        try {
            const res = await axios.post(
                'https://api.cloudinary.com/v1_1/dupjdmjha/image/upload',
                formData
            );
            return res.data.secure_url;
        } catch (err) {
            console.error('Cloudinary Upload Failed:', err);
            return null;
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert('Please fill out both the title and message.');
            return;
        }
        if (schedule === 'later' && (!scheduledDate || !scheduledTime)) {
            alert('Please choose both date and time for scheduled notifications.');
            return;
        }

        setLoading(true);
        try {
            const imageUrl = await handleImageUpload();

            await addDoc(collection(db, 'notifications'), {
                title,
                message,
                category,
                audience,
                imageUrl: imageUrl || '',
                schedule: schedule === 'now' ? 'immediately' : `on ${scheduledDate} at ${scheduledTime}`,
                timestamp: Timestamp.now(),
            });

            alert(`Notification sent to ${audience}`);
            setTitle('');
            setMessage('');
            setCharCount(0);
            setAudience('all');
            setCategory('updates');
            setSchedule('now');
            setScheduledDate('');
            setScheduledTime('');
            setPopupVisible(false);
            setImageFile(null);
            setImagePreview('');

            const querySnapshot = await getDocs(collection(db, 'notifications'));
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
            await deleteDoc(doc(db, 'notifications', id));
            setNotifications(prev => prev.filter(notification => notification.id !== id));
            alert('Notification deleted successfully!');
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification.');
        }
    };

    const handleDeleteReply = async (id) => {
        try {
            await deleteDoc(doc(db, 'adminMessages', id));
            setAdminReplies(prev => prev.filter(reply => reply.id !== id));
            alert('Admin reply deleted successfully!');
        } catch (error) {
            console.error('Error deleting admin reply:', error);
            alert('Failed to delete reply.');
        }
    };

    const categoryIcons = {
        updates: '🔔',
        promotions: '🎉',
        reminders: '⏰',
        alerts: '⚠️',
    };

    const filteredNotifications = notifications.filter(n => {
        const notifDateStr = n.timestamp?.toDate?.().toLocaleString() || '';
        const search = searchTermNotif.toLowerCase();
        return (
            n.title?.toLowerCase().includes(search) ||
            n.message?.toLowerCase().includes(search) ||
            notifDateStr.toLowerCase().includes(search)
        );
    });


    const filteredReplies = adminReplies.filter(r => {
        const sentDateStr = r.sentAt?.toDate?.().toLocaleString() || '';
        const search = searchTermReply.toLowerCase();
        return (
            r.message?.toLowerCase().includes(search) ||
            r.to?.toLowerCase().includes(search) ||
            sentDateStr.toLowerCase().includes(search)
        );
    });
    const SkeletonCard = () => (
        <li className="notification-item skeleton-card">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-line"></div>
            <div className="skeleton skeleton-line medium"></div>
            <div className="skeleton skeleton-line short"></div>
        </li>
    );

    const SkeletonList = ({ count = 3 }) => (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </>
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h2>Notification Management</h2>
                </div>


                <div className="notif-header-row">
                    <div className="ntab-buttons">
                        <button className={`ntab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                            Notifications
                        </button>
                        <button className={`ntab ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
                            Feedback Replies
                        </button>
                    </div>

                    <div className="notif-top-controls">
                        <button className="notif-top-controls-button" onClick={() => setPopupVisible(true)}>
                            + New Notification
                        </button>
                    </div>
                </div>

                {activeTab === 'notifications' && (
                    <div className="notification-history">
                        <h3>Notification History</h3>
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Search notifications..."
                            value={searchTermNotif}
                            onChange={(e) => setSearchTermNotif(e.target.value)}
                        />
                        <ul className="notification-list">
                            {loadingNotifs ? (
                                <SkeletonList count={4} />
                            ) : (
                                filteredNotifications.map((notif) => {
                                    const dateSent = notif.timestamp?.toDate?.().toLocaleString?.() || 'Unknown Date';
                                    const icon = categoryIcons[notif.category] || '📢';
                                    return (
                                        <li key={notif.id} className="notification-item">
                                            <div className="notif-image">
                                                {notif.imageUrl ? (
                                                    <img
                                                        src={notif.imageUrl}
                                                        alt="notification"
                                                        className="notif-thumbnail"
                                                        onClick={() => setModalImageUrl(notif.imageUrl)}
                                                    />
                                                ) : (
                                                    <div className="icon-placeholder">{icon}</div>
                                                )}
                                            </div>
                                            <div className="notif-details">
                                                <strong>{notif.title}</strong>
                                                <p>{notif.message}</p>
                                                <small>{dateSent}</small>
                                            </div>
                                            <button className="delete-btn" onClick={() => handleDelete(notif.id)}>
                                                Delete
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>

                        {modalImageUrl && (
                            <div className="modal-overlay" onClick={() => setModalImageUrl(null)}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                    <img src={modalImageUrl} alt="Full view" className="modal-image" />
                                    <button onClick={() => setModalImageUrl(null)} className="ok-button">OK</button>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {activeTab === 'feedback' && (
                    <div className="admin-reply-history">
                        <h3>Feedback Replies</h3>
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Search feedback replies..."
                            value={searchTermReply}
                            onChange={(e) => setSearchTermReply(e.target.value)}
                        />
                        <ul className="notification-list">
                            {loadingReplies ? (
                                <SkeletonList count={3} />
                            ) : (
                                filteredReplies.map((reply) => {
                                    const sentDate = reply.sentAt?.toDate?.().toLocaleString?.() || 'Unknown Date';
                                    return (
                                        <li key={reply.id} className="notification-item">
                                            <div className="notif-image">
                                                <div className="icon-placeholder">💬</div>
                                            </div>
                                            <div className="notif-details">
                                                <strong>{reply.to ? `To: ${reply.to}` : 'Reply Sent'}</strong>
                                                <p>{reply.message}</p>
                                                <small>{sentDate}</small>
                                            </div>
                                            <button className="delete-btn" onClick={() => handleDeleteReply(reply.id)}>
                                                Delete
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>

                    </div>
                )}

                {popupVisible && (
                    <div className="popup-overlay">
                        <div className="notification-popup scrollable-popup">
                            <form className="popup-content" onSubmit={handleSend}>
                                <h3>Create Notification</h3>
                                <label>Title</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

                                <label>Message</label>
                                <textarea
                                    rows={4}
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        setCharCount(e.target.value.length);
                                    }}
                                    maxLength={300}
                                    required
                                />
                                <small>{charCount}/300 characters</small>

                                <label>Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="updates">Updates</option>
                                    <option value="promotions">Promotions</option>
                                    <option value="reminders">Reminders</option>
                                    <option value="alerts">Alerts</option>
                                </select>

                                <label>Audience</label>
                                <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                                    <option value="all">All Users</option>
                                    <option value="registered">Registered Users</option>
                                    <option value="guest">Guest Users</option>
                                </select>

                                <label>Schedule</label>
                                <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                                    <option value="now">Immediately</option>
                                    <option value="later">Schedule for Later</option>
                                </select>

                                {schedule === 'later' && (
                                    <>
                                        <label>Date</label>
                                        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                                        <label>Time</label>
                                        <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                                    </>
                                )}

                                <label>Optional Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setImageFile(e.target.files[0]);
                                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                                    }}
                                />
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" style={{ width: '100%', marginTop: 10 }} />
                                )}

                                <div className="popup-actions">
                                    <button type="submit" className="send-btn" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send'}
                                    </button>
                                    <button type="button" className="exit-btn" onClick={() => setPopupVisible(false)}>
                                        Cancel
                                    </button>
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
