import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from '../components/Sidebar';
import './FeedbackReview.css';

const FeedbackReview = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Location Feedback');
    const [feedbackList, setFeedbackList] = useState([]);

    const [averageRating, setAverageRating] = useState('N/A');
    const [mostLovedLocation, setMostLovedLocation] = useState('N/A');
    const [areaOfConcern, setAreaOfConcern] = useState('N/A');
    const [mostLovedFeature, setMostLovedFeature] = useState('N/A');
    const [areaOfConcernFeature, setAreaOfConcernFeature] = useState('N/A');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState('');
    const [selectedFeatureOrLocation, setSelectedFeatureOrLocation] = useState('');
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const isFeatureTab = activeTab === 'Feature Feedback';
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const feedback = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFeedbackList(feedback);
                calculateStats(feedback, activeTab);
            } catch (error) {
                console.error('Error fetching feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedback();
    },);

    useEffect(() => {
        calculateStats(feedbackList, activeTab);
    }, [activeTab, feedbackList]);

    const calculateStats = (data, tabType) => {
        const isFeature = tabType === 'Feature Feedback';
        const filtered = data.filter(item =>
            isFeature ? item.feedbackType === 'App Feedback' : item.feedbackType === 'Location Feedback'
        );

        if (isFeature) {
            setMostLovedFeature('N/A');
            setAreaOfConcernFeature('N/A');
        } else {
            setMostLovedLocation('N/A');
            setAreaOfConcern('N/A');
        }

        const avg = filtered.reduce((acc, cur) => acc + (cur.rating || 0), 0) / filtered.length;
        setAverageRating(isNaN(avg) ? 'N/A' : avg.toFixed(1));

        const categoryRatings = {};
        filtered.forEach(item => {
            const key = isFeature ? item.feature : item.location;
            if (key) {
                if (!categoryRatings[key]) categoryRatings[key] = [];
                categoryRatings[key].push(item.rating || 0);
            }
        });

        const averages = Object.entries(categoryRatings).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length
        }));

        if (averages.length) {
            averages.sort((a, b) => b.avg - a.avg);
            if (isFeature) {
                setMostLovedFeature(averages[0].key);
                setAreaOfConcernFeature(averages[averages.length - 1].key);
            } else {
                setMostLovedLocation(averages[0].key);
                setAreaOfConcern(averages[averages.length - 1].key);
            }
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
    };

    const filteredFeedback = feedbackList.filter(item =>
        (
            (isFeatureTab && item.feedbackType === 'App Feedback') ||
            (!isFeatureTab && item.feedbackType === 'Location Feedback')
        ) &&
        (
            item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.location || item.feature)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.createdAt?.toDate?.().toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rating?.toString().includes(searchTerm)
        )
    );


    const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

    const formatTimestamp = (timestamp) =>
        timestamp?.toDate ? timestamp.toDate().toLocaleString() : 'N/A';

    const sendMessage = async () => {
        if (!messageText.trim()) return alert("Message cannot be empty.");
        setIsSending(true);
        try {
            await addDoc(collection(db, 'adminMessages'), {
                to: selectedUserEmail,
                message: messageText,
                context: selectedFeatureOrLocation,
                contextType: isFeatureTab ? "Feature" : "Location",
                sentAt: serverTimestamp(),
            });
            alert("Message sent successfully!");
            setIsModalOpen(false);
            setMessageText('');
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="dashboard-main">
                <div className="dashboard-header">

                    <h2>Feedback Overview</h2>
                </div>

                <div className="cards-container">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="card brown">
                                    <div className="skeleton skeleton-icon"></div>
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-line short"></div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="card brown">
                                <p>Average Rating ({isFeatureTab ? 'Feature' : 'Location'})</p>
                                <h2 style={{ color: 'green' }}>{averageRating}</h2>
                            </div>
                            {!isFeatureTab ? (
                                <>
                                    <div className="card brown">
                                        <p>Most Loved Location</p>
                                        <h2>{mostLovedLocation}</h2>
                                    </div>
                                    <div className="card brown">
                                        <p>Area of Concern</p>
                                        <h2>{areaOfConcern}</h2>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="card brown">
                                        <p>Most Loved Feature</p>
                                        <h2>{mostLovedFeature}</h2>
                                    </div>
                                    <div className="card brown">
                                        <p>Area of Concern (Feature)</p>
                                        <h2>{areaOfConcernFeature}</h2>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>



                <div className="mtab-buttons">
                    <button
                        className={`mtab ${activeTab === 'Location Feedback' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Location Feedback')}
                    >
                        Location Feedback
                    </button>
                    <button
                        className={`mtab ${activeTab === 'Feature Feedback' ? 'active' : ''}`}
                        onClick={() => handleTabClick('Feature Feedback')}
                    >
                        Feature Feedback
                    </button>
                </div>


                <div className="main-content">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by email, feature/location,message or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>{isFeatureTab ? 'App Feature' : 'Location'}</th>
                                <th>Feedback</th>
                                <th>Image</th>
                                <th>Rating</th>
                                <th>Time</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                // Skeleton Loader Rows
                                <>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td colSpan="7">
                                                <div className="skeleton-card">
                                                    <div className="skeleton skeleton-title"></div>
                                                    <div className="skeleton skeleton-line medium"></div>
                                                    <div className="skeleton skeleton-line"></div>
                                                    <div className="skeleton skeleton-line short"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ) : filteredFeedback.length > 0 ? (
                                filteredFeedback.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.email}</td>
                                        <td>{isFeatureTab ? entry.feature || 'N/A' : entry.location || 'N/A'}</td>
                                        <td>{entry.comment}</td>
                                        <td>
                                            {entry.imageUrl ? (
                                                <img
                                                    src={entry.imageUrl}
                                                    alt="Feedback"
                                                    className="feedback-image"
                                                    onClick={() => {
                                                        setImagePreview(entry.imageUrl);
                                                        setShowImageModal(true);
                                                    }}
                                                />
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td>{renderStars(entry.rating || 0)}</td>
                                        <td>{formatTimestamp(entry.createdAt)}</td>
                                        <td>
                                            <button
                                                className="action-btn"
                                                onClick={() => {
                                                    setSelectedUserEmail(entry.email);
                                                    setSelectedFeatureOrLocation(isFeatureTab ? entry.feature || 'N/A' : entry.location || 'N/A');
                                                    setIsModalOpen(true);
                                                }}
                                            >
                                                Send Message
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                        No feedback found.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                    {isModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>Send Message to <span className="modal-email">{selectedUserEmail}</span></h3>
                                <p className="modal-sub">
                                    Regarding: <strong>{isFeatureTab ? "Feature" : "Location"} - {selectedFeatureOrLocation}</strong>
                                </p>
                                <textarea
                                    className="modal-textarea"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={5}
                                />
                                <div className="modal-actions">
                                    <button className="send-btn" onClick={sendMessage} disabled={isSending}>
                                        {isSending ? 'Sending...' : 'Send'}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isSending}>
                                        Cancel

                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackReview;