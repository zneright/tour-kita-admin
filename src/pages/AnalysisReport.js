// ... [imports remain unchanged]
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
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
    const [showAll, setShowAll] = useState(false);
    const [ratingFilter, setRatingFilter] = useState('top');
    const [activeFeedbackTab, setActiveFeedbackTab] = useState('location');


    useEffect(() => {
        const fetchData = async () => {
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
                const loc = fb.location;
                const rating = fb.rating;
                if (loc && typeof rating === 'number') {
                    if (!locationRatings[loc]) {
                        locationRatings[loc] = { total: 0, count: 0 };
                    }
                    locationRatings[loc].total += rating;
                    locationRatings[loc].count += 1;
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
        };

        fetchData();
    }, []);

    const guestUsers = users.filter(user => user.status === 'guest');

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType.toLowerCase()) return false;
            const date = moment(user.registeredDate);
            return filter === 'Yearly' || date.year() === parseInt(selectedYear.toString());
        });
    }, [selectedYear, userType, filter, users]);

    const sortedFeedbacks = useMemo(() => {
        const filtered = feedbacks.filter(f => f.rating);
        return [...filtered].sort((a, b) => ratingFilter === 'top' ? b.rating - a.rating : a.rating - b.rating);
    }, [feedbacks, ratingFilter]);

    const displayFeedbacks = showAll ? sortedFeedbacks : sortedFeedbacks.slice(0, 10);
    const locationCount = feedbacks.filter(f => f.feedbackType === 'Location Feedback').length;
    const appCount = feedbacks.filter(f => f.feedbackType === 'App Feedback').length;

    const getUserActivityData = useMemo(() => {
        const activity = {};
        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            let key = '';
            if (filter === 'Monthly') key = date.format('MMM');
            else if (filter === 'Quarterly') key = `Q${Math.ceil((date.month() + 1) / 3)}`;
            else key = date.year().toString();
            activity[key] = (activity[key] || 0) + 1;
        });

        const getKeys = () => {
            if (filter === 'Monthly') return moment.monthsShort();
            if (filter === 'Quarterly') return ['Q1', 'Q2', 'Q3', 'Q4'];
            return [...new Set(users.map(user => moment(user.registeredDate).year()))].sort().map(String);
        };

        return getKeys().map(name => ({ name, users: activity[name] || 0 }));
    }, [filter, selectedYear, filteredUsers, users]);

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
                    <div className="card brown">
                        <FaStar size={22} color="#F39C12" />
                        <h2>Average Rating</h2>
                        <p className="big-number">{averageRating.toFixed(1)} </p>
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
                                : 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="chart-container">
                    <h3>Feedback Overview</h3>

                    <div className="feedback-tab-header">
                        <div className="feedback-tabs">
                            <button
                                className={activeFeedbackTab === 'location' ? 'active' : ''}
                                onClick={() => setActiveFeedbackTab('location')}
                            >
                                Location Feedback
                            </button>
                            <button
                                className={activeFeedbackTab === 'app' ? 'active' : ''}
                                onClick={() => setActiveFeedbackTab('app')}
                            >
                                App Feedback
                            </button>
                        </div>
                        <div className="feedback-controls">
                            <button onClick={() => setRatingFilter('top')} disabled={ratingFilter === 'top'}>Top Rated</button>
                            <button onClick={() => setRatingFilter('low')} disabled={ratingFilter === 'low'}>Low Rated</button>
                            <button onClick={() => setShowAll(!showAll)}>
                                {showAll ? 'Show Top 5' : 'Show All'}
                            </button>
                        </div>
                    </div>
                    {activeFeedbackTab === 'location' && (
                        <>
                            <h4>Location Feedbacks ({locationCount})</h4>
                            {(() => {
                                const locationFeedbacks = feedbacks
                                    .filter(f => f.feedbackType === 'Location Feedback' && typeof f.rating === 'number');

                                const grouped = {};
                                locationFeedbacks.forEach(fb => {
                                    const loc = fb.location || 'N/A';
                                    if (!grouped[loc]) grouped[loc] = [];
                                    grouped[loc].push(fb.rating);
                                });

                                let locationRatings = Object.entries(grouped).map(([location, ratings]) => {
                                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                                    return {
                                        location,
                                        average: parseFloat(avg.toFixed(1)),
                                        count: ratings.length
                                    };
                                });

                                locationRatings = locationRatings.sort((a, b) =>
                                    ratingFilter === 'top' ? b.average - a.average : a.average - b.average
                                );

                                const toShow = showAll ? locationRatings : locationRatings.slice(0, 5);

                                return toShow.map((loc, idx) => (
                                    <div key={`loc-${idx}`} className="feedback-card">
                                        <strong>{loc.location}</strong> — Rating: {loc.average}⭐ ({loc.count} rating{loc.count > 1 ? 's' : ''})
                                    </div>
                                ));
                            })()}
                        </>
                    )}

                    {activeFeedbackTab === 'app' && (
                        <>
                            <h4>App Feedbacks ({appCount})</h4>
                            {(() => {
                                const appFeedbacks = feedbacks
                                    .filter(f => f.feedbackType === 'App Feedback' && typeof f.rating === 'number');

                                const grouped = {};
                                appFeedbacks.forEach(fb => {
                                    const key = fb.feature || 'General';
                                    if (!grouped[key]) grouped[key] = [];
                                    grouped[key].push(fb.rating);
                                });

                                let featureRatings = Object.entries(grouped).map(([feature, ratings]) => {
                                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                                    return {
                                        feature,
                                        average: parseFloat(avg.toFixed(1)),
                                        count: ratings.length
                                    };
                                });

                                featureRatings = featureRatings.sort((a, b) =>
                                    ratingFilter === 'top' ? b.average - a.average : a.average - b.average
                                );

                                const toShow = showAll ? featureRatings : featureRatings.slice(0, 5);

                                return toShow.map((f, idx) => (
                                    <div key={`app-${idx}`} className="feedback-card">
                                        <strong>{f.feature}</strong> — Rating: {f.average}⭐ ({f.count} rating{f.count > 1 ? 's' : ''})
                                    </div>
                                ));
                            })()}
                        </>
                    )}

                </div>
                <div className="filter-container mt-8">
                    <div className="chart-filters">
                        <div className="filter-group">
                            <label>Filter By:</label>
                            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
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
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getUserActivityData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="users" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
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
            </main>
        </div>
    );
};

export default AnalysisReport;
