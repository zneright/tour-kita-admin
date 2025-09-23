// AnalysisReport.js
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { FaUsers, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import moment from 'moment';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

const AnalysisReport = () => {
    const currentYear = new Date().getFullYear();
    const [users, setUsers] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [topRatedLocation, setTopRatedLocation] = useState(null);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [filter, setFilter] = useState('Monthly');
    const [userType, setUserType] = useState('All');
    const [loading, setLoading] = useState(true);

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
                        status: 'registered'
                    };
                });
                setUsers(userList);

                const feedbackSnapshot = await getDocs(collection(db, 'feedbacks'));
                const feedbackList = feedbackSnapshot.docs.map(doc => doc.data());

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

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType.toLowerCase()) return false;
            const date = moment(user.registeredDate);
            return filter === 'Yearly' || date.year() === parseInt(selectedYear.toString());
        });
    }, [selectedYear, userType, filter, users]);

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
            return [...new Set(filteredUsers.map(user => moment(user.registeredDate).year()))]
                .sort()
                .map(String);
        };

        return getKeys().map(name => ({
            name,
            users: activity[name] || 0
        }));
    }, [filteredUsers, filter]);

    const genderChartData = useMemo(() => {
        let periods = [];
        if (filter === 'Monthly') periods = moment.monthsShort();
        else if (filter === 'Quarterly') periods = ['Q1', 'Q2', 'Q3', 'Q4'];
        else periods = [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort();

        const group = {};
        periods.forEach(p => group[p] = {});

        filteredUsers.forEach(u => {
            let periodKey = '';
            const date = moment(u.registeredDate);
            if (filter === 'Monthly') periodKey = date.format('MMM');
            else if (filter === 'Quarterly') periodKey = `Q${Math.ceil((date.month() + 1) / 3)}`;
            else periodKey = date.year().toString();

            const gender = u.gender || 'Prefer Not to Say';
            group[periodKey][gender] = (group[periodKey][gender] || 0) + 1;
        });

        const allGenders = [...new Set(filteredUsers.map(u => u.gender || 'Prefer Not to Say'))];
        return Object.entries(group).map(([period, counts]) => {
            allGenders.forEach(g => {
                if (!(g in counts)) counts[g] = 0;
            });
            return { period, ...counts };
        });
    }, [filteredUsers, filter]);

    const userTypeChartData = useMemo(() => {
        let periods = [];
        if (filter === 'Monthly') periods = moment.monthsShort();
        else if (filter === 'Quarterly') periods = ['Q1', 'Q2', 'Q3', 'Q4'];
        else periods = [...new Set(filteredUsers.map(u => moment(u.registeredDate).year()))].sort();

        const group = {};
        periods.forEach(p => group[p] = {});

        filteredUsers.forEach(u => {
            let periodKey = '';
            const date = moment(u.registeredDate);
            if (filter === 'Monthly') periodKey = date.format('MMM');
            else if (filter === 'Quarterly') periodKey = `Q${Math.ceil((date.month() + 1) / 3)}`;
            else periodKey = date.year().toString();

            const type = u.userType || 'Other';
            group[periodKey][type] = (group[periodKey][type] || 0) + 1;
        });

        const allTypes = [...new Set(filteredUsers.map(u => u.userType || 'Other'))];
        return Object.entries(group).map(([period, counts]) => {
            allTypes.forEach(t => {
                if (!(t in counts)) counts[t] = 0;
            });
            return { period, ...counts };
        });
    }, [filteredUsers, filter]);

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
            let periodKey = filter === 'Monthly'
                ? date.format('MMM')
                : filter === 'Quarterly'
                    ? `Q${Math.ceil((date.month() + 1) / 3)}`
                    : date.year().toString();

            const ageKey = `${Math.floor(u.age / 10) * 10}-${Math.floor(u.age / 10) * 10 + 9}`;
            group[periodKey][ageKey] = (group[periodKey][ageKey] || 0) + 1;
        });

        const allAgeGroups = [...new Set(filteredUsers.map(u => `${Math.floor(u.age / 10) * 10}-${Math.floor(u.age / 10) * 10 + 9}`))];

        return Object.entries(group).map(([period, counts]) => {
            allAgeGroups.forEach(age => {
                if (!(age in counts)) counts[age] = 0;
            });
            return { period, ...counts };
        });
    }, [filteredUsers, filter]);

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
                                <option value="local">Local</option>
                                <option value="researcher">Researcher</option>
                                <option value="foreign national">Foreign National</option>
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

                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h3>Age Distribution ({filter === 'Yearly' ? selectedYear : filter})</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={ageChartData}>
                            <XAxis dataKey="period" />
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
