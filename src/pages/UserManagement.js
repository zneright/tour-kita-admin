import React from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <div className="main-content">
                    <h2>User Management</h2>
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search"
                    />

                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>USER ID</th>
                                <th>Email</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Gender</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>001</td>
                                <td>Jane@email.com</td>
                                <td>Jane Doe</td>
                                <td>29</td>
                                <td>Female</td>
                            </tr>
                            <tr>
                                <td>002</td>
                                <td>Jan@email.com</td>
                                <td>Jan Vince</td>
                                <td>23</td>
                                <td>Female</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default UserManagement;
