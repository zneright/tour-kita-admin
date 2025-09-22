// AnalysisReport.js
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { FaUsers, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import moment from 'moment';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

const AnalysisReport = () => {
    const currentYear = new Date().getFullYear();
    const [users, setUsers] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [topRatedLocation, setTopRatedLocation] = useState(null);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [filter, setFilter] = useState('Monthly');
    const [userType, setUserType] = useState('All');
    const [activeFeedbackTab, setActiveFeedbackTab] = useState('location');
    const [loading, setLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState('top');
    const [showAll, setShowAll] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const isInSelectedPeriod = (date, filter, selectedPeriod) => {
        if (!date) return false;
        const d = moment(date.toDate ? date.toDate() : date);

        if (filter === 'Weekly') {
            return selectedPeriod
                ? d.isSame(selectedPeriod.value, 'week')
                : d.isSame(moment(), 'week');
        }

        if (filter === 'Monthly') {
            return selectedPeriod
                ? d.isSame(selectedPeriod.value, 'month')
                : d.isSame(moment(), 'month');
        }

        if (filter === 'Quarterly') {
            if (selectedPeriod) {
                return (
                    d.year() === selectedPeriod.value.year &&
                    d.quarter() === selectedPeriod.value.quarter
                );
            }
            return (
                d.year() === moment().year() &&
                d.quarter() === moment().quarter()
            );
        }

        if (filter === 'Yearly') {
            return selectedPeriod
                ? d.year() === selectedPeriod.value
                : d.year() === moment().year();
        }

        return false;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userSnapshot = await getDocs(collection(db, 'users'));
                const userList = userSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.uid,
                        name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                        age: data.age || 0,
                        gender: data.gender || '',
                        contactNumber: data.contactNumber || '',
                        email: data.email || '',
                        userType: (data.userType || '').toLowerCase(),
                        registeredDate: data.createdAt || '',
                        status: 'registered'
                    };
                });
                setUsers(userList);

                const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
                const feedbackList = feedbackSnapshot.docs.map(doc => doc.data());
                setFeedbacks(feedbackList);

                const ratings = feedbackList.map(f => f.rating).filter(r => typeof r === 'number');
                const avg = ratings.length ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) : 0;
                setAverageRating(parseFloat(avg.toFixed(1)));

                const locationRatings = {};
                feedbackList.forEach(fb => {
                    if (fb.location && typeof fb.rating === 'number') {
                        if (!locationRatings[fb.location]) locationRatings[fb.location] = { total: 0, count: 0 };
                        locationRatings[fb.location].total += fb.rating;
                        locationRatings[fb.location].count += 1;
                    }
                });

                let topLocation = null;
                let maxAvg = 0;
                for (const [loc, { total, count }] of Object.entries(locationRatings)) {
                    const avgRating = total / count;
                    if (avgRating > maxAvg) {
                        maxAvg = avgRating;
                        topLocation = { name: loc, rating: avgRating };
                    }
                }
                setTopRatedLocation(topLocation);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const isInSelectedPeriod = (date, filter, selectedPeriod) => {
        if (!date) return false;
        const d = moment(date.toDate ? date.toDate() : date);

        if (filter === 'Weekly') {
            return selectedPeriod
                ? d.isSame(selectedPeriod.value, 'week')
                : d.isSame(moment(), 'week');
        }

        if (filter === 'Monthly') {
            return selectedPeriod
                ? d.isSame(selectedPeriod.value, 'month')
                : d.isSame(moment(), 'month');
        }

        if (filter === 'Quarterly') {
            if (selectedPeriod) {
                return (
                    d.year() === selectedPeriod.value.year &&
                    d.quarter() === selectedPeriod.value.quarter
                );
            }
            return (
                d.year() === moment().year() &&
                d.quarter() === moment().quarter()
            );
        }

        if (filter === 'Yearly') {
            return selectedPeriod
                ? d.year() === selectedPeriod.value
                : d.year() === moment().year();
        }

        return false;
    };

    const guestUsers = users.filter(user => user.status === 'guest');
    const filterFeedbacksByPeriod = (feedbacks, filter, selectedPeriod) => {
        return feedbacks.filter(fb => {
            const date = moment(fb.createdAt.toDate ? fb.createdAt.toDate() : fb.createdAt);

            if (filter === 'Weekly') {
                if (selectedPeriod) return date.isSame(selectedPeriod.value, 'week');
                return date.isSame(moment(), 'week'); // default = current week
            }

            if (filter === 'Monthly') {
                if (selectedPeriod) return date.isSame(selectedPeriod.value, 'month');
                return date.isSame(moment(), 'month');
            }

            if (filter === 'Quarterly') {
                if (selectedPeriod) {
                    return date.quarter() === selectedPeriod.value.quarter &&
                        date.year() === selectedPeriod.value.year;
                }
                return date.quarter() === moment().quarter() &&
                    date.year() === moment().year();
            }

            if (filter === 'Yearly') {
                if (selectedPeriod) return date.year() === selectedPeriod.value;
                return date.year() === moment().year();
            }

            return true;
        });
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType.toLowerCase()) return false;
            const date = moment(user.registeredDate);
            return filter === 'Yearly' || date.year() === parseInt(selectedYear.toString());
        });
    }, [selectedYear, userType, filter, users]);

    const getGroupedFeedback = (typeKey, labelKey) => {
        const filteredFeedbacks = useMemo(() => filterFeedbacksByPeriod(feedbacks, filter, selectedPeriod), [feedbacks, filter, selectedPeriod]);

        const locationFeedbacks = getGroupedFeedback('Location Feedback', 'location', filteredFeedbacks);
        const appFeedbacks = getGroupedFeedback('App Feedback', 'feature', filteredFeedbacks);

        const relevant = feedbacks.filter(f => f.feedbackType === typeKey && typeof f.rating === 'number');
        const grouped = {};

        relevant.forEach(fb => {
            const key = fb[labelKey] || 'N/A';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(fb.rating);
        });

        let result = Object.entries(grouped).map(([key, ratings]) => {
            const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
            return {
                name: key,
                average: parseFloat(avg.toFixed(1)),
                count: ratings.length
            };
        });

        result = result.sort((a, b) =>
            ratingFilter === 'top' ? b.average - a.average : a.average - b.average
        );

        return showAll ? result : result.slice(0, 5);
    };

    const locationFeedbacks = getGroupedFeedback('Location Feedback', 'location');
    const appFeedbacks = getGroupedFeedback('App Feedback', 'feature');

    const locationCount = feedbacks.filter(f => f.feedbackType === 'Location Feedback').length;
    const appCount = feedbacks.filter(f => f.feedbackType === 'App Feedback').length;

    const getUserActivityData = useMemo(() => {
        const activity = {};
        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            let key = '';

            if (filter === 'Weekly') key = date.format('ddd');
            else if (filter === 'Monthly') key = date.format('MMM');
            else if (filter === 'Quarterly') key = `Q${Math.ceil((date.month() + 1) / 3)}`;
            else key = date.year().toString();

            activity[key] = (activity[key] || 0) + 1;
        });

        const getKeys = () => {
            if (filter === 'Weekly') {
                const startOfWeek = moment().startOf('isoWeek');
                return Array.from({ length: 7 }, (_, i) =>
                    moment(startOfWeek).add(i, 'days').format('ddd')
                );
            }

            if (filter === 'Monthly') return moment.monthsShort();
            if (filter === 'Quarterly') return ['Q1', 'Q2', 'Q3', 'Q4'];
            return [...new Set(filteredUsers.map(user => moment(user.registeredDate).year()))]
                .sort()
                .map(String);
        };

        return getKeys().map(name => ({
            name,
            users: activity[name] || 0
        }));
    }, [filteredUsers, filter]);



    const genderData = useMemo(() => {
        const male = filteredUsers.filter(u => u.gender?.toLowerCase() === 'male').length;
        const female = filteredUsers.filter(u => u.gender?.toLowerCase() === 'female').length;
        return [
            { name: 'Male', value: male },
            { name: 'Female', value: female },
        ];
    }, [filteredUsers]);

    const userTypeData = useMemo(() => {
        const student = filteredUsers.filter(u => u.userType === 'student').length;
        const tourist = filteredUsers.filter(u => u.userType === 'tourist').length;
        return [
            { name: 'Student', value: student },
            { name: 'Tourist', value: tourist },
        ];
    }, [filteredUsers]);

    const ageGroupData = useMemo(() => {
        const groups = { '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };
        filteredUsers.forEach(user => {
            if (user.age < 18) groups['<18']++;
            else if (user.age <= 24) groups['18-24']++;
            else if (user.age <= 34) groups['25-34']++;
            else if (user.age <= 44) groups['35-44']++;
            else groups['45+']++;
        });
        return Object.entries(groups).map(([ageGroup, value]) => ({ ageGroup, value }));
    }, [filteredUsers]);

    const showYearSelection = filter !== 'Yearly';

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="report-header">
                    <h2>Analysis & Reports</h2>
                </div>

                <div className="cards-container">
                    {loading ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
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
                                <FaStar size={22} color="#F39C12" />
                                <h2>Average Rating</h2>
                                <p className="big-number">{averageRating.toFixed(1)}</p>
                            </div>
                            <div className="card brown">
                                <FaUsers size={22} color="#3498DB" />
                                <h2>Registered Users</h2>
                                <p className="big-number">{filteredUsers.length.toLocaleString()}</p>
                            </div>
                            <div className="card brown">
                                <FaUsers size={22} color="#E74C3C" />
                                <h2>Guest Users</h2>
                                <p className="big-number">{guestUsers.length.toLocaleString()}</p>
                            </div>
                            <div className="card brown">
                                <FaMapMarkerAlt size={22} color="#9B59B6" />
                                <h2>Top Destination</h2>
                                <p className="big-number">
                                    {topRatedLocation
                                        ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})`
                                        : "N/A"}
                                </p>
                            </div>
                        </>
                    )}
                </div>


                <div className="chart-container">
                    <h3>Feedback Overview</h3>

                    {loading ? (
                        <div className="skeleton-faq">
                            <div className="skeleton skeleton-faq-title"></div>
                            <div className="skeleton-faq-item">
                                <div className="skeleton skeleton-faq-q"></div>
                                <div className="skeleton skeleton-faq-a"></div>
                            </div>
                            <div className="skeleton-faq-item">
                                <div className="skeleton skeleton-faq-q"></div>
                                <div className="skeleton skeleton-faq-a"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="tab-bars markers-tabs">
                                <div className="tabs-left">
                                    <button
                                        className={`mtab ${activeFeedbackTab === 'location' ? 'active' : ''}`}
                                        onClick={() => setActiveFeedbackTab('location')}
                                    >
                                        Location Feedback
                                    </button>
                                    <button
                                        className={`mtab ${activeFeedbackTab === 'app' ? 'active' : ''}`}
                                        onClick={() => setActiveFeedbackTab('app')}
                                    >
                                        App Feedback
                                    </button>
                                </div>
                                <div className="drilldown-list">
                                    {filter === 'Yearly' && [...new Set(feedbacks.map(fb => moment(fb.createdAt.toDate ? fb.createdAt.toDate() : fb.createdAt).year()))]
                                        .sort((a, b) => b - a)
                                        .map(year => (
                                            <div key={year} onClick={() => setSelectedPeriod({ type: 'year', value: year })}>
                                                Year {year}
                                            </div>
                                        ))
                                    }

                                    {filter === 'Monthly' && Array.from({ length: 12 }).map((_, i) => {
                                        const month = moment().month(i).format('MMM');
                                        return (
                                            <div key={month} onClick={() => setSelectedPeriod({ type: 'month', value: moment().month(i).format('YYYY-MM') })}>
                                                {month}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="tabs-right top5-tabs">
                                    <button
                                        className={`top5-brown-tab ${ratingFilter === 'top' ? 'active' : ''}`}
                                        onClick={() => setRatingFilter('top')}
                                    >
                                        Top 5 Highest
                                    </button>
                                    <button
                                        className={`top5-brown-tab ${ratingFilter === 'lowest' ? 'active' : ''}`}
                                        onClick={() => setRatingFilter('lowest')}
                                    >
                                        Top 5 Lowest
                                    </button>
                                    <button
                                        className={`top5-brown-tab ${showAll ? 'active' : ''}`}
                                        onClick={() => setShowAll(!showAll)}
                                    >
                                        {showAll ? 'Show Top 5' : 'Show All'}
                                    </button>
                                </div>

                            </div>



                            {locationFeedbacks.map((loc, idx) => (
                                <div
                                    key={`loc-${idx}`}
                                    className="feedback-card"
                                    onClick={() => setSelectedFeedback({ type: 'location', name: loc.name })}
                                >
                                    <strong>{loc.name}</strong> — Rating: {loc.average}⭐ ({loc.count})
                                </div>
                            ))}


                            {activeFeedbackTab === 'app' && (
                                <>
                                    <h4>App Feedbacks ({appCount})</h4>
                                    {appFeedbacks.map((f, idx) => (
                                        <div key={`app-${idx}`} className="feedback-card">
                                            <strong>{f.name}</strong> — Rating: {f.average}⭐ ({f.count})
                                        </div>
                                    ))}

                                    {!showAll && appCount > 5 && (
                                        <button onClick={() => setShowAll(true)}>Show All</button>
                                    )}
                                    {showAll && (
                                        <button onClick={() => setShowAll(false)}>Show Top 5</button>
                                    )}
                                </>
                            )}

                        </>
                    )}
                </div>

                <div className="filter-container mt-8">
                    <div className="chart-filters">
                        <div className="filter-group">
                            <label>Filter By:</label>
                            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        {showYearSelection && (
                            <div className="filter-group">
                                <label>Year:</label>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                    {[...new Set(users.map(u => moment(u.registeredDate).year()))]
                                        .sort((a, b) => b - a)
                                        .map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                </select>
                            </div>
                        )}
                        <div className="filter-group">
                            <label>User Type:</label>
                            <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                                <option value="All">All</option>
                                <option value="student">Student</option>
                                <option value="tourist">Tourist</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Registration Trends</h3>
                    {loading ? (
                        <div className="skeleton" style={{ height: '300px', borderRadius: '10px' }}></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getUserActivityData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="users" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>


                <div className="pie-charts-flex">
                    <div className="chart-container">
                        <h3>Gender Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {genderData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="chart-container">
                        <h3>User Type Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={userTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {userTypeData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h3>Age Group Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ageGroupData}>
                            <XAxis dataKey="ageGroup" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {selectedFeedback && (
                    <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>All Feedbacks for {selectedFeedback.name}</h3>
                            {feedbacks
                                .filter(fb =>
                                    selectedFeedback.type === 'location'
                                        ? fb.location === selectedFeedback.name
                                        : fb.feature === selectedFeedback.name
                                )
                                .filter(fb =>
                                    isInSelectedPeriod(fb.createdAt, filter, selectedPeriod)
                                )
                                .map((fb, i) => (
                                    <div key={i} className="feedback-detail">
                                        <p><strong>Rating:</strong> {fb.rating}⭐</p>
                                        <p><strong>Comment:</strong> {fb.comment || 'No comment'}</p>
                                        <p><strong>Date:</strong> {moment(fb.createdAt.toDate ? fb.createdAt.toDate() : fb.createdAt).format('MMM DD, YYYY')}</p>
                                    </div>
                                ))
                            }

                        </div>
                    </div>
                )}

            </main>
        </div>

    );
};

export default AnalysisReport;
