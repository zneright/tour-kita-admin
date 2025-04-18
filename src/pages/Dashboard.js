import React from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h1>Overview</h1>
                    <div className="date-filter">Today ⌄</div>
                </div>

                <div className="cards-container">
                    <div className="card purple">
                        <p>Active Users</p>
                        <h2>156</h2>
                        <span>+15.03%</span>
                    </div>
                    <div className="card blue">
                        <p>Active Registered</p>
                        <h2>114</h2>
                        <span>+11.01%</span>
                    </div>
                    <div className="card lightblue">
                        <p>Active Guest</p>
                        <h2>42</h2>
                        <span>+6.08%</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
