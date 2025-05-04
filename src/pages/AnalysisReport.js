import React, { useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import constantUsers from '../data/constantusers';
import './AnalysisReport.css';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    CartesianGrid
} from 'recharts';
import { FaUsers, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import moment from 'moment';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

const AnalysisReport = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [filter, setFilter] = useState('Monthly');
    const [userType, setUserType] = useState('All');
    const [featureRatingView, setFeatureRatingView] = useState('top');

    const totalRegisteredUsers = constantUsers.filter(user => user.status === 'registered');
    const guestUsers = constantUsers.filter(user => user.status === 'guest');

    const filteredUsers = useMemo(() => {
        return constantUsers.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType) return false;
            const date = moment(user.registeredDate);
            return filter === 'Yearly' || date.year() === parseInt(selectedYear.toString());
        });
    }, [selectedYear, userType, filter]);

    const getUserActivityData = useMemo(() => {
        const activity: Record<string, number> = {};
        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            let key = '';
            if (filter === 'Monthly') {
                key = date.format('MMM');
            } else if (filter === 'Quarterly') {
                key = `Q${Math.ceil((date.month() + 1) / 3)}`;
            } else {
                key = date.year().toString();
            }
            activity[key] = (activity[key] || 0) + 1;
        });

        const getKeys = () => {
            if (filter === 'Monthly') {
                return moment.monthsShort();
            } else if (filter === 'Quarterly') {
                return ['Q1', 'Q2', 'Q3', 'Q4'];
            } else {
                return Array.from(new Set(
                    constantUsers
                        .filter(user => user.status === 'registered')
                        .map(user => moment(user.registeredDate).year())
                )).sort((a, b) => a - b).map(year => year.toString());
            }
        };

        return getKeys().map(name => ({
            name,
            users: activity[name] || 0
        }));
    }, [filter, selectedYear, filteredUsers]);

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

    const destinationRatings = [
        { name: 'Manila Cathedral', views: 1200, rating: 4.8 },
        { name: 'Fort Santiago', views: 980, rating: 4.6 },
        { name: 'Casa Manila', views: 870, rating: 4.5 },
        { name: 'San Agustin Church', views: 750, rating: 4.4 },
        { name: 'Baluarte de San Diego', views: 700, rating: 4.3 },
        { name: 'Plaza de Roma', views: 620, rating: 4.2 },
        { name: 'Intramuros Walls', views: 590, rating: 4.1 },
    ];

    const topDestination = destinationRatings.reduce((top, dest) => dest.rating > top.rating ? dest : top, destinationRatings[0]);

    const showYearSelection = filter !== 'Yearly';

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="report-header">
                    <h2>Analysis & Reports</h2>
                </div>

                {/* CARDS */}
                <div className="cards-container">
                    <div className="card brown">
                        <FaStar size={22} color="#F39C12" />
                        <h2>Average Rating</h2>
                        <p className="big-number">4.6 ⭐</p>
                        <span className="positive">+5.4% {filter.toLowerCase()}</span>
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
                        <p className="big-number">{topDestination.name}</p>
                    </div>
                </div>

                {/* Filters Inline */}
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
                                    {Array.from(new Set(constantUsers.map(user => moment(user.registeredDate).year()))).sort((a, b) => b - a).map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
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

                {/* Registration Trends */}
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

                {/* Pie Charts */}
                <div className="pie-charts-flex">
                    <div className="chart-container">
                        <h3>Gender Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`gender-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                <Pie
                                    data={userTypeData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {userTypeData.map((entry, index) => (
                                        <Cell key={`userType-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Age Group Distribution */}
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

                {/* Vertical Line Chart for Top Destinations */}
                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h2>Top Rated Sites - Intramuros</h2>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={destinationRatings}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 'auto']} />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="views" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
};

export default AnalysisReport;
