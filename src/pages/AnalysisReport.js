import React from 'react';
import Sidebar from '../components/Sidebar';
import './AnalysisReport.css';

const AnalysisReport = () => {
    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <h2>Analysis & Reports</h2>

                <div className="analytics-grid">
                    <div className="analytics-card">
                        <h3>Average Rating</h3>
                        <p className="big-number">4.6 ⭐</p>
                        <span className="positive">+5.4% this week</span>
                    </div>

                    <div className="analytics-card">
                        <h3>Registered Users</h3>
                        <p className="big-number">1,245</p>
                        <span className="positive">+8.1% growth</span>
                    </div>

                    <div className="analytics-card">
                        <h3>Guest Users</h3>
                        <p className="big-number">432</p>
                        <span className="negative">−2.3% this week</span>
                    </div>

                    <div className="analytics-card">
                        <h3>Most Viewed Destination</h3>
                        <p className="big-number">Manila Cathedral</p>
                    </div>
                </div>

                <div className="chart-placeholder">
                    <h3>User Activity</h3>
                    <div className="fake-chart">📊</div>
                </div>
            </main>
        </div>
    );
};

export default AnalysisReport;
