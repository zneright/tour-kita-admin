import React, { useEffect, useState } from 'react';
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import constantUsers from '../data/constantusers';

const Dashboard = () => {
    const [topRatedDestinations, setTopRatedDestinations] = useState([]);

    const nonArchivedUsers = constantUsers.filter(user => user.status !== 'archived');
    const activeUsers = nonArchivedUsers.filter(user => user.activestatus);
    const activeRegistered = activeUsers.filter(user => user.status === 'registered');
    const activeGuests = activeUsers.filter(user => user.status === 'guest');

    useEffect(() => {
        const fetchRatings = async () => {
            const feedbackSnapshot = await getDocs(collection(db, 'feedbacks')); // ✅ updated collection name
            const ratingsMap = {};

            feedbackSnapshot.forEach(doc => {
                const data = doc.data();
                const location = data.location;
                const rating = data.rating;

                if (!location) return;

                if (!ratingsMap[location]) {
                    ratingsMap[location] = {
                        total: 0,
                        count: 0,
                        withRatingCount: 0,
                    };
                }

                if (rating !== undefined && rating !== null) {
                    ratingsMap[location].total += rating;
                    ratingsMap[location].withRatingCount += 1;
                }

                ratingsMap[location].count += 1;
            });

            const processed = Object.entries(ratingsMap).map(([location, values]) => ({
                site: location,
                rating:
                    values.withRatingCount > 0
                        ? parseFloat((values.total / values.withRatingCount).toFixed(2))
                        : 0,
                feedbackCount: values.count,
            }));

            const topByRating = processed
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5);

            setTopRatedDestinations(topByRating);
        };

        fetchRatings();
    }, []);

    const getPercentageColor = (value: number) => {
        if (value > 0) return { color: 'green' };
        if (value < 0) return { color: 'red' };
        return { color: '#999' };
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div classname="dashboard-header">
                    <h2>Overview</h2>
                </div>


                <div className="cards-container">
                    <div className="card brown">
                        <p>Online All Users</p>
                        <h2>{activeUsers.length}</h2>
                        <span style={getPercentageColor(15.03)}>+15.03%</span>
                    </div>
                    <div className="card brown">
                        <p>Online Registered Users</p>
                        <h2>{activeRegistered.length}</h2>
                        <span style={getPercentageColor(11.01)}>+11.01%</span>
                    </div>
                    <div className="card brown">
                        <p>Online Guests Users</p>
                        <h2>{activeGuests.length}</h2>
                        <span style={getPercentageColor(-6.08)}>-6.08%</span>
                    </div>
                </div>

                <div className="chart-container" style={{ marginTop: '2rem' }}>
                    <h2>Top Rated Sites - Based on User Feedback</h2>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            data={topRatedDestinations}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 5]} />
                            <YAxis type="category" dataKey="site" />
                            <Tooltip
                                formatter={(value, name) => {
                                    if (name === 'rating') return [`${value} / 5`, 'Average Rating'];
                                    if (name === 'feedbackCount') return [value, 'Total Feedback'];
                                    return value;
                                }}
                            />
                            <Bar dataKey="rating" fill="#AB886D" barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                    <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
                        * Only locations with feedback are shown. Some locations may have feedback without ratings.
                    </p>
                </div>
            </main >
        </div >
    );
};

export default Dashboard;
