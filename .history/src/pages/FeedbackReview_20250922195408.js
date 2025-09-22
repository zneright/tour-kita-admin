import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from '../components/Sidebar';
import './FeedbackReview.css';
import {
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter, startOfYear, endOfYear,
    subWeeks, subMonths, subQuarters, subYears
} from 'date-fns';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';

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
    const isAllTab = activeTab === 'All Feedback';
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const isLocationTab = activeTab === 'Location Feedback';
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const maxDisplay = 20;
    const [isExpanded, setIsExpanded] = useState(false);
    const handleShowMore = () => {
        setDisplayCount(Math.min(filteredFeedback.length, maxDisplay));
        setIsExpanded(true);
    };
    useEffect(() => {
        setDisplayCount(5);
    }, [activeTab, searchTerm]);

    const handleShowLess = () => {
        setDisplayCount(5);
        setIsExpanded(false);
    };
    const [timeFilter, setTimeFilter] = useState('Weekly');
    const [chartData, setChartData] = useState([]);
    const [viewLevel, setViewLevel] = useState('overview');
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    const getDateRange = (filter) => {
        const now = new Date();
        switch (filter) {
            case 'Weekly': {
                const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
                const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
                return [lastWeekStart, lastWeekEnd];
            }
            case 'Monthly': {
                const lastMonthStart = startOfMonth(subMonths(now, 1));
                const lastMonthEnd = endOfMonth(subMonths(now, 1));
                return [lastMonthStart, lastMonthEnd];
            }
            case 'Quarterly': {
                const lastQuarterStart = startOfQuarter(subQuarters(now, 1));
                const lastQuarterEnd = endOfQuarter(subQuarters(now, 1));
                return [lastQuarterStart, lastQuarterEnd];
            }
            case 'Yearly': {
                const lastYearStart = startOfYear(subYears(now, 1));
                const lastYearEnd = endOfYear(subYears(now, 1));
                return [lastYearStart, lastYearEnd];
            }
            default:
                return [null, null];
        }
    }; useEffect(() => {
        if (!feedbackList.length) return;

        const [startDate, endDate] = getDateRange(timeFilter);
        const filtered = feedbackList.filter(item => {
            const createdAt = item.createdAt?.toDate?.();
            return createdAt && createdAt >= startDate && createdAt <= endDate;
        });

        // Group by period
        let grouped = {};
        filtered.forEach(item => {
            const createdAt = item.createdAt.toDate();
            let key;

            if (timeFilter === 'Weekly') {
                key = createdAt.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
            } else if (timeFilter === 'Monthly') {
                key = `Week ${Math.ceil(createdAt.getDate() / 7)}`;
            } else if (timeFilter === 'Quarterly') {
                key = createdAt.toLocaleString('en-US', { month: 'short' }); // Jan, Feb, etc.
            } else if (timeFilter === 'Yearly') {
                key = `Q${Math.ceil((createdAt.getMonth() + 1) / 3)}`;
            }

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item.rating || 0);
        });

        const data = Object.entries(grouped).map(([label, ratings]) => ({
            period: label,
            avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length
        }));

        setChartData(data);
    }, [timeFilter, feedbackList]);

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
        let filtered;
        if (tabType === 'Feature Feedback') {
            filtered = data.filter(item => item.feedbackType === 'App Feedback');
            setMostLovedFeature('N/A');
            setAreaOfConcernFeature('N/A');
        } else if (tabType === 'Location Feedback') {
            filtered = data.filter(item => item.feedbackType === 'Location Feedback');
            setMostLovedLocation('N/A');
            setAreaOfConcern('N/A');
        } else { // All Feedback
            filtered = data;
            setMostLovedFeature('N/A');
            setAreaOfConcernFeature('N/A');
            setMostLovedLocation('N/A');
            setAreaOfConcern('N/A');
        }

        const avg = filtered.reduce((acc, cur) => acc + (cur.rating || 0), 0) / filtered.length;
        setAverageRating(isNaN(avg) ? 'N/A' : avg.toFixed(1));

        const categoryRatings = {};
        filtered.forEach(item => {
            const key = item.feature || item.location;
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
            if (tabType === 'Feature Feedback') {
                setMostLovedFeature(averages[0].key);
                setAreaOfConcernFeature(averages[averages.length - 1].key);
            } else if (tabType === 'Location Feedback') {
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
        (isAllTab ||
            (isFeatureTab && item.feedbackType === 'App Feedback') ||
            (isLocationTab && item.feedbackType === 'Location Feedback')) &&
        (
            item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.location || item.feature)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.createdAt?.toDate?.().toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.rating?.toString().includes(searchTerm)
        )
    );

    const displayedFeedback = filteredFeedback.slice(0, displayCount);



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
                    <button
                        className={`mtab ${activeTab === 'All Feedback' ? 'active' : ''}`}
                        onClick={() => handleTabClick('All Feedback')}
                    >
                        All Feedback
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
                                <th></th>
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
                                [...Array(5)].map((_, i) => (
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
                                ))
                            ) : displayedFeedback.length > 0 ? (
                                displayedFeedback.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td>{index + 1}</td>
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
                                            ) : '—'}
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
                            {filteredFeedback.length > 5 && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '10px' }}>
                                        {!isExpanded && (
                                            <button className="show-more-btn" onClick={handleShowMore}>
                                                Show More
                                            </button>
                                        )}
                                        {isExpanded && (
                                            <button className="show-less-btn" onClick={handleShowLess}>
                                                Close
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}


                        </tbody>


                    </table>

                    <div className="ratings-analysis">
                        <h3>Ratings Analysis</h3>

                        <div className="time-filter">
                            {['Weekly', 'Monthly', 'Quarterly', 'Yearly'].map(filter => (
                                <button
                                    key={filter}
                                    className={`mtab ${timeFilter === filter ? 'active' : ''}`}
                                    onClick={() => setTimeFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="period" />
                                    <YAxis domain={[0, 5]} />
                                    <Tooltip />
                                    <Bar dataKey="avgRating" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px' }}>No data available for {timeFilter}.</p>
                        )}
                    </div>
                    <div className="ratings-drilldown">
                        {viewLevel === 'overview' && (
                            <div>
                                <h3>{timeFilter} Top Destinations</h3>
                                {chartData.map(dest => (
                                    <div
                                        key={dest.period}
                                        className="card"
                                        onClick={() => {
                                            setSelectedPeriod(dest.period);
                                            setViewLevel('daily');
                                        }}
                                    >
                                        <h4>{dest.period}</h4>
                                        <p>Avg Rating: {dest.avgRating.toFixed(1)}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewLevel === 'daily' && (
                            <div>
                                <h3>Daily Breakdown for {selectedPeriod}</h3>
                                {/* Replace with your grouped-by-day data */}
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div
                                        key={day}
                                        className="card"
                                        onClick={() => {
                                            setSelectedPeriod(day);
                                            setViewLevel('table');
                                        }}
                                    >
                                        <h4>{day}</h4>
                                        <p>Top destination here…</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewLevel === 'table' && (
                            <div>
                                <h3>Feedback Table for {selectedPeriod}</h3>
                                {/* You already have feedback table above, just filter */}
                                <table>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Rating</th>
                                            <th>Comment</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbackData
                                            .filter(f => f.date.includes(selectedPeriod))
                                            .map((f, i) => (
                                                <tr key={i}>
                                                    <td>{f.user}</td>
                                                    <td>{f.rating}</td>
                                                    <td>{f.comment}</td>
                                                    <td>{f.date}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>


                    {showImageModal && (
                        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                            <div className="modal-content">
                                <img src={imagePreview} alt="Preview" className="preview-image" />
                            </div>
                        </div>
                    )}

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