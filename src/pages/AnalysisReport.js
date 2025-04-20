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
    Cell
} from 'recharts';
import { FaUsers, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import moment from 'moment';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3'];

const AnalysisReport = () => {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [filter, setFilter] = useState('Monthly');
    const [userType, setUserType] = useState('All');
    const [featureRatingView, setFeatureRatingView] = useState('top');
    const [destinationRatingView, setDestinationRatingView] = useState('top');

    const filteredUsers = useMemo(() => {
        return constantUsers.filter(user => {
            if (user.status !== 'registered') return false;
            if (userType !== 'All' && user.userType !== userType) return false;
            const date = moment(user.registeredDate);
            return date.year() === parseInt(selectedYear);
        });
    }, [selectedYear, userType]);

    const totalRegisteredUsers = constantUsers.filter(user => user.status === 'registered');
    const guestUsers = constantUsers.filter(user => user.status === 'guest');

    const engagementData = [
        { name: 'Registered', value: totalRegisteredUsers.length },
        { name: 'Guests', value: guestUsers.length },
    ];

    const getUserActivityData = () => {
        const activity = {};
        filteredUsers.forEach(user => {
            const date = moment(user.registeredDate);
            let key = '';
            if (filter === 'Monthly') {
                key = date.format('MMM');
            } else if (filter === 'Quarterly') {
                key = `Q${Math.ceil((date.month() + 1) / 3)}`;
            } else if (filter === 'Yearly') {
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
                return [selectedYear.toString()];
            }
        };

        return getKeys().map(name => ({
            name,
            users: activity[name] || 0
        }));
    };

    const activityData = useMemo(getUserActivityData, [filter, selectedYear, filteredUsers]);

    const allAppFeatureRatings = [
        { feature: 'User Interface (UI)', rating: 4.8 },
        { feature: 'Navigation Accuracy', rating: 4.7 },
        { feature: 'Historical Content', rating: 4.6 },
        { feature: 'Accessibility Features', rating: 4.6 },
        { feature: 'Performance & Speed', rating: 4.5 },
        { feature: 'Review & Feedback System', rating: 4.5 },
        { feature: 'Tour Suggestions', rating: 4.4 },
        { feature: 'AR Experience', rating: 4.3 },
        { feature: 'Multilingual Support', rating: 4.2 },
        { feature: 'Offline Mode', rating: 4.1 },
    ];

    const appFeatureRatings = allAppFeatureRatings
        .sort((a, b) =>
            featureRatingView === 'top' ? b.rating - a.rating : a.rating - b.rating
        )
        .slice(0, 5);

    const destinationRatings = [
        { name: 'Manila Cathedral', views: 1200, rating: 4.8 },
        { name: 'Fort Santiago', views: 980, rating: 4.6 },
        { name: 'Casa Manila', views: 870, rating: 4.5 },
        { name: 'San Agustin Church', views: 750, rating: 4.4 },
        { name: 'Baluarte de San Diego', views: 700, rating: 4.3 },
        { name: 'Plaza de Roma', views: 620, rating: 4.2 },
        { name: 'Intramuros Walls', views: 590, rating: 4.1 },
    ];

    const topDestinations = destinationRatings
        .sort((a, b) =>
            destinationRatingView === 'top' ? b.rating - a.rating : a.rating - b.rating
        )
        .slice(0, 5);

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
                        <p className="big-number">4.6 ⭐</p>
                        <span className="positive">+5.4% {filter.toLowerCase()}</span>
                    </div>

                    <div className="card brown">
                        <FaUsers size={22} color="#3498DB" />
                        <h2>Registered Users</h2>
                        <p className="big-number">{filteredUsers.length.toLocaleString()}</p>
                        {(() => {
                            const value = 8.1;
                            return (
                                <span className={value >= 0 ? 'positive' : 'negative'}>
                                    {value >= 0 ? `+${value}%` : `${value}%`} growth
                                </span>
                            );
                        })()}
                    </div>

                    <div className="card brown">
                        <FaUsers size={22} color="#E74C3C" />
                        <h2>Guest Users</h2>
                        <p className="big-number">{guestUsers.length.toLocaleString()}</p>
                        {(() => {
                            const value = -2.3;
                            return (
                                <span className={value >= 0 ? 'positive' : 'negative'}>
                                    {value >= 0 ? `+${value}%` : `${value}%`} {filter.toLowerCase()}
                                </span>
                            );
                        })()}
                    </div>

                    <div className="card brown">
                        <FaMapMarkerAlt size={22} color="#9B59B6" />
                        <h2>Top Destination</h2>
                        <p className="big-number">Manila Cathedral</p>
                    </div>
                </div>

                <div className="chart-filters">
                    <div className="filter-group">
                        <label>Year:</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                            {[2022, 2023, 2024, 2025].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Filter By:</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>User Type:</label>
                        <select value={userType} onChange={(e) => setUserType(e.target.value)}>
                            <option value="All">All</option>
                            <option value="student">Student</option>
                            <option value="tourist">Tourist</option>
                            <option value="local">Local</option>
                        </select>
                    </div>
                </div>

                <div className="chart-section">
                    <div className="line-chart">
                        <h3>User Activity</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={activityData}>
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="users" stroke="#4CAF50" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="pie-chart">
                        <h3>User Engagement</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={engagementData} dataKey="value" nameKey="name" outerRadius={80} label>
                                    {engagementData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="top-destinations">
                    <div className="table-header">
                        <h3>{destinationRatingView === 'top' ? 'Top Rated' : 'Lowest Rated'} Destinations</h3>
                        <select value={destinationRatingView} onChange={(e) => setDestinationRatingView(e.target.value)}>
                            <option value="top">Top 5 Rated</option>
                            <option value="low">Low 5 Rated</option>
                        </select>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Destination</th>
                                <th>Views</th>
                                <th>Average Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topDestinations.map((dest, index) => (
                                <tr key={index}>
                                    <td>{dest.name}</td>
                                    <td>{dest.views.toLocaleString()}</td>
                                    <td>{dest.rating.toFixed(1)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="top-destinations">
                    <div className="table-header">
                        <h3>{featureRatingView === 'top' ? 'Top Rated' : 'Lowest Rated'} App Features</h3>
                        <select value={featureRatingView} onChange={(e) => setFeatureRatingView(e.target.value)}>
                            <option value="top">Top 5 Rated</option>
                            <option value="low">Low 5 Rated</option>
                        </select>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Average Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appFeatureRatings.map((feature, index) => (
                                <tr key={index}>
                                    <td>{feature.feature}</td>
                                    <td>{feature.rating.toFixed(1)} ⭐</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AnalysisReport;
