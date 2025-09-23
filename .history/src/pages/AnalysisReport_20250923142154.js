// AnalysisReport.js
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
    const [groupAge, setGroupAge] = useState(false);

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
                        userType: (data.userType || '').toLowerCase(),
                        registeredDate: data.createdAt || '',
                        status: 'registered',
                    };
                });
                setUsers(userList);

                const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
                const feedbackList = feedbackSnapshot.docs.map(doc => doc.data());
                setFeedbacks(feedbackList);

                // Average rating
                const ratings = feedbackList.map(f => f.rating).filter(r => typeof r === 'number');
                const avg = ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
                setAverageRating(parseFloat(avg.toFixed(1)));

                // Top-rated location
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
                Object.entries(locationRatings).forEach(([loc, { total, count }]) => {
                    const avgRating = total / count;
                    if (avgRating > maxAvg) {
                        maxAvg = avgRating;
                        topLocation = { name: loc, rating: avgRating };
                    }
                });
                setTopRatedLocation(topLocation);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType.toLowerCase()) return false;
            const date = moment(user.registeredDate);
            return filter === 'Yearly' || date.year() === selectedYear;
        });
    }, [users, userType, filter, selectedYear]);

    const guestUsers = users.filter(user => user.status === 'guest');

    const getGroupedFeedback = (typeKey, labelKey) => {
        const relevant = feedbacks.filter(f => f.feedbackType === typeKey && typeof f.rating === 'number');
        const grouped = {};
        relevant.forEach(fb => {
            const key = fb[labelKey] || 'N/A';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(fb.rating);
        });

        let result = Object.entries(grouped).map(([key, ratings]) => ({
            name: key,
            average: parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)),
            count: ratings.length,
        }));

        result.sort((a, b) => (ratingFilter === 'top' ? b.average - a.average : a.average - b.average));
        return showAll ? result : result.slice(0, 5);
    };

    const locationFeedbacks = getGroupedFeedback('Location Feedback', 'location');
    const appFeedbacks = getGroupedFeedback('App Feedback', 'feature');

    const getUserActivityData = useMemo(() => {
        const activity = {};
        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            let key = filter === 'Monthly'
                ? date.format('MMM')
                : filter === 'Quarterly'
                    ? `Q${Math.ceil((date.month() + 1) / 3)}`
                    : date.year().toString();
            activity[key] = (activity[key] || 0) + 1;
        });

        const keys = filter === 'Monthly' ? moment.monthsShort()
            : filter === 'Quarterly' ? ['Q1', 'Q2', 'Q3', 'Q4']
                : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort();

        return keys.map(name => ({ name, users: activity[name] || 0 }));
    }, [filteredUsers, filter]);

    const getChartData = (groupKey) => {
        const periods = filter === 'Monthly'
            ? moment.monthsShort()
            : filter === 'Quarterly'
                ? ['Q1', 'Q2', 'Q3', 'Q4']
                : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort();

        const group = {};
        periods.forEach(p => group[p] = {});

        filteredUsers.forEach(u => {
            const date = moment(u.registeredDate);
            const periodKey = filter === 'Monthly' ? date.format('MMM') :
                filter === 'Quarterly' ? `Q${Math.ceil((date.month() + 1) / 3)}` : date.year().toString();
            const key = u[groupKey] || 'Other';
            group[periodKey][key] = (group[periodKey][key] || 0) + 1;
        });

        const allKeys = [...new Set(filteredUsers.map(u => u[groupKey] || 'Other'))];
        return Object.entries(group).map(([period, counts]) => {
            allKeys.forEach(k => { if (!(k in counts)) counts[k] = 0; });
            return { period, ...counts };
        });
    };

    const genderChartData = useMemo(() => getChartData('gender'), [filteredUsers, filter]);
    const userTypeChartData = useMemo(() => getChartData('userType'), [filteredUsers, filter]);

    const ageChartData = useMemo(() => {
        const periods = filter === 'Monthly'
            ? moment.monthsShort()
            : filter === 'Quarterly'
                ? ['Q1', 'Q2', 'Q3', 'Q4']
                : [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort();

        const group = {};
        periods.forEach(p => group[p] = {});

        filteredUsers.forEach(u => {
            const date = moment(u.registeredDate);
            const periodKey = filter === 'Monthly' ? date.format('MMM') :
                filter === 'Quarterly' ? `Q${Math.ceil((date.month() + 1) / 3)}` : date.year().toString();
            const ageKey = `${Math.floor(u.age / 10) * 10}-${Math.floor(u.age / 10) * 10 + 9}`;
            group[periodKey][ageKey] = (group[periodKey][ageKey] || 0) + 1;
        });

        const allAgeGroups = [...new Set(filteredUsers.map(u => `${Math.floor(u.age / 10) * 10}-${Math.floor(u.age / 10) * 10 + 9}`))];
        return Object.entries(group).map(([period, counts]) => {
            allAgeGroups.forEach(age => { if (!(age in counts)) counts[age] = 0; });
            return { period, ...counts };
        });
    }, [filteredUsers, filter]);

    const ageGroupData = useMemo(() => {
        const ageCounts = {};
        filteredUsers.forEach(user => {
            if (user.age != null) ageCounts[user.age] = (ageCounts[user.age] || 0) + 1;
        });
        return Object.entries(ageCounts).sort((a, b) => a[0] - b[0]).map(([age, value]) => ({ ageGroup: age, value }));
    }, [filteredUsers]);

    const showYearSelection = filter !== 'Yearly';

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="report-header"><h2>Analysis & Reports</h2></div>

                {/* Cards */}
                <div className="cards-container">
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="card brown">
                                <div className="skeleton skeleton-icon"></div>
                                <div className="skeleton skeleton-title"></div>
                                <div className="skeleton skeleton-line short"></div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div className="card brown"><FaStar size={22} color="#F39C12" /><h2>Average Rating</h2><p className="big-number">{averageRating.toFixed(1)}</p></div>
                            <div className="card brown"><FaUsers size={22} color="#3498DB" /><h2>Registered Users</h2><p className="big-number">{filteredUsers.length.toLocaleString()}</p></div>
                            <div className="card brown"><FaUsers size={22} color="#E74C3C" /><h2>Guest Users</h2><p className="big-number">{guestUsers.length.toLocaleString()}</p></div>
                            <div className="card brown"><FaMapMarkerAlt size={22} color="#9B59B6" /><h2>Top Destination</h2><p className="big-number">{topRatedLocation ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})` : "N/A"}</p></div>
                        </>
                    )}
                </div>

                {/* Registration Trends */}
                <div className="chart-container">
                    <h3>Registration Trends</h3>
                    {loading ? <div className="skeleton" style={{ height: '300px', borderRadius: '10px' }}></div> :
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={getUserActivityData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="users" stroke="#82ca9d" />
                            </LineChart>
                        </ResponsiveContainer>}
                </div>

                {/* Gender Distribution */}
                <div className="chart-container">
                    <h3>Gender Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={genderChartData}>
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            {Object.keys(genderChartData[0] || {}).filter(k => k !== 'period').map((gender, idx) => (
                                <Bar key={gender} dataKey={gender} stackId="a" fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* User Type Distribution */}
                <div className="chart-container">
                    <h3>User Type Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={userTypeChartData}>
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            {Object.keys(userTypeChartData[0] || {}).filter(k => k !== 'period').map((type, idx) => (
                                <Bar key={type} dataKey={type} stackId="a" fill={COLORS[idx % COLORS.length]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Age Distribution */}
                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h3>Age Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>
                            <input type="checkbox" checked={groupAge} onChange={(e) => setGroupAge(e.target.checked)} /> Group ages into ranges
                        </label>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={groupAge ? ageChartData : ageGroupData}>
                            <XAxis dataKey={groupAge ? "period" : "ageGroup"} />
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
