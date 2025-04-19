import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaUsers, FaChartLine, FaStar, FaMapMarkerAlt } from 'react-icons/fa';

const userActivityData = [
    { name: 'Mon', users: 200 },
    { name: 'Tue', users: 300 },
    { name: 'Wed', users: 250 },
    { name: 'Thu', users: 400 },
    { name: 'Fri', users: 500 },
    { name: 'Sat', users: 450 },
    { name: 'Sun', users: 380 },
];

const engagementData = [
    { name: 'Registered', value: 1245 },
    { name: 'Guests', value: 432 },
];

const COLORS = ['#4CAF50', '#FF7043'];

const AnalysisReport = () => {
    const [filter, setFilter] = useState('week');

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <div className="report-header">
                    <h2>Analysis & Reports</h2>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>

                <div className="analytics-grid">
                    <div className="analytics-card">
                        <FaStar size={22} color="#F39C12" />
                        <h3>Average Rating</h3>
                        <p className="big-number">4.6 ⭐</p>
                        <span className="positive">+5.4% this week</span>
                    </div>

                    <div className="analytics-card">
                        <FaUsers size={22} color="#3498DB" />
                        <h3>Registered Users</h3>
                        <p className="big-number">1,245</p>
                        <span className="positive">+8.1% growth</span>
                    </div>

                    <div className="analytics-card">
                        <FaUsers size={22} color="#E74C3C" />
                        <h3>Guest Users</h3>
                        <p className="big-number">432</p>
                        <span className="negative">−2.3% this week</span>
                    </div>

                    <div className="analytics-card">
                        <FaMapMarkerAlt size={22} color="#9B59B6" />
                        <h3>Top Destination</h3>
                        <p className="big-number">Manila Cathedral</p>
                    </div>
                </div>

                <div className="chart-section">
                    <div className="line-chart">
                        <h3>User Activity</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={userActivityData}>
                                <XAxis dataKey="name" />
                                <YAxis />
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
                    <h3>Top Viewed Destinations</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Destination</th>
                                <th>Views</th>
                                <th>Average Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Manila Cathedral</td>
                                <td>1,200</td>
                                <td>4.8</td>
                            </tr>
                            <tr>
                                <td>Fort Santiago</td>
                                <td>980</td>
                                <td>4.6</td>
                            </tr>
                            <tr>
                                <td>Casa Manila</td>
                                <td>870</td>
                                <td>4.5</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AnalysisReport;
