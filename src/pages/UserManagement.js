import React, { useState } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';

const initialUsers = [
    { id: '001', email: 'Jane@email.com', name: 'Jane Doe', age: 29, gender: 'Female' },
    { id: '002', email: 'Jan@email.com', name: 'Jan Vince', age: 23, gender: 'Female' },
    { id: '003', email: 'John@email.com', name: 'John Cruz', age: 32, gender: 'Male' },
];

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [users] = useState(initialUsers);

    const filteredUsers = users.filter(
        user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.id.includes(search)
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />

            <main className="dashboard-main">
                <div className="main-content">
                    <h2>User Management</h2>
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by name, email or ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="table-responsive">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.email}</td>
                                            <td>{user.name}</td>
                                            <td>{user.age}</td>
                                            <td>{user.gender}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserManagement;
