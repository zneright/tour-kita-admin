import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    const [filter, setFilter] = useState("Today");

    const dataSets = {
        Today: [
            { name: '9 AM', users: 200 },
            { name: '12 PM', users: 450 },
            { name: '3 PM', users: 320 },
            { name: '6 PM', users: 560 },
        ],
        Monthly: [
            { name: 'Week 1', users: 900 },
            { name: 'Week 2', users: 1400 },
            { name: 'Week 3', users: 1100 },
            { name: 'Week 4', users: 1700 },
        ],
        Quarterly: [
            { name: 'Jan', users: 1200 },
            { name: 'Feb', users: 900 },
            { name: 'Mar', users: 1500 },
            { name: 'Apr', users: 2200 },
            { name: 'May', users: 3100 },
            { name: 'Jun', users: 2500 },
            { name: 'Jul', users: 2800 },
        ]
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Overview</h1>
                    <select className="date-filter" value={filter} onChange={handleFilterChange}>
                        <option value="Today">Today</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                    </select>
                </div>

                <div className="cards-container">
                    <div className="card purple">
                        <p>Active Users</p>
                        <h2>{filter === "Today" ? 156 : filter === "Monthly" ? 3120 : 8800}</h2>
                        <span>+15.03%</span>
                    </div>
                    <div className="card blue">
                        <p>Active Registered</p>
                        <h2>{filter === "Today" ? 114 : filter === "Monthly" ? 2280 : 6450}</h2>
                        <span>+11.01%</span>
                    </div>
                    <div className="card lightblue">
                        <p>Active Guest</p>
                        <h2>{filter === "Today" ? 42 : filter === "Monthly" ? 840 : 2350}</h2>
                        <span>+6.08%</span>
                    </div>
                </div>

                <div className="chart-container">
                    <h2>Total Additional Users</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dataSets[filter]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="users" stroke="#000" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
