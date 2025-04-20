import React from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import constantUsers from '../data/constantusers';

const Dashboard = () => {
    const nonArchivedUsers = constantUsers.filter(user => user.status !== 'archived');
    const activeUsers = nonArchivedUsers.filter(user => user.online);
    const activeRegistered = activeUsers.filter(user => user.status === 'registered');
    const activeGuests = activeUsers.filter(user => user.status === 'guest');

    const topRatedDestinations = [
        { site: 'Manila Cathedral', rating: 4.8 },
        { site: 'Fort Santiago', rating: 4.6 },
        { site: 'Casa Manila', rating: 4.5 },
        { site: 'San Agustin Church', rating: 4.4 },
        { site: 'Baluarte de San Diego', rating: 4.3 },
    ];

    const getPercentageColor = (value) => {
        if (value > 0) return { color: 'green' };
        if (value < 0) return { color: 'red' };
        return { color: '#999' };
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Overview</h1>
                </div>

                <div className="cards-container">
                    <div className="card brown">
                        <p>Active Users</p>
                        <h2>{activeUsers.length}</h2>
                        <span style={getPercentageColor(15.03)}>+15.03%</span>
                    </div>
                    <div className="card brown">
                        <p>Active Registered</p>
                        <h2>{activeRegistered.length}</h2>
                        <span style={getPercentageColor(11.01)}>+11.01%</span>
                    </div>
                    <div className="card brown">
                        <p>Active Guests</p>
                        <h2>{activeGuests.length}</h2>
                        <span style={getPercentageColor(-6.08)}>-6.08%</span>
                    </div>
                </div>

                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h2>Top Rated Sites - Intramuros</h2>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={topRatedDestinations}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 5]} />
                            <YAxis type="category" dataKey="site" />
                            <Tooltip formatter={(value) => `${value} / 5`} />
                            <Bar dataKey="rating" fill="#AB886D" barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
