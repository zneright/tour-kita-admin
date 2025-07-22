import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // make sure your Firebase config is in this file

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const usersList = usersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.uid,
                        email: data.email || '',
                        name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                        age: data.age || 0,
                        gender: data.gender || '',
                        contactNumber: data.contactNumber || '',
                        status: 'registered', // Default all to 'registered' unless you store status
                        activestatus: true, // Or fetch from Firestore if you store this
                        userType: data.userType || '',
                        registeredDate: data.createdAt
                            ? new Date(data.createdAt).toLocaleDateString()
                            : 'N/A',
                    };
                });
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleArchive = (userId, reason) => {
        alert(`🚫 User ID: ${userId} has been archived.\nReason: ${reason}`);
        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, status: 'archived' } : user
        );
        setUsers(updatedUsers);
    };

    const handleWarnAndArchive = (userId) => {
        const reason = prompt(`Enter a reason to archive User ID: ${userId}`);
        if (reason) {
            handleArchive(userId, reason);
        }
    };

    const filterUsers = () => {
        return users.filter(user => {
            const matchesSearch =
                (user.name?.toLowerCase().includes(search.toLowerCase()) || false) ||
                (user.email?.toLowerCase().includes(search.toLowerCase()) || false) ||
                user.id.toLowerCase().includes(search.toLowerCase());

            const matchesFilter =
                viewFilter === 'all'
                    ? user.status !== 'archived'
                    : viewFilter === 'archived'
                        ? user.status === 'archived'
                        : user.status === viewFilter;

            return matchesSearch && matchesFilter;
        });
    };

    const countByStatus = (statusType) => users.filter(u => u.status === statusType).length;
    const totalUsers = users.filter(u => u.status !== 'archived').length;
    const registeredCount = countByStatus('registered');
    const guestCount = countByStatus('guest');
    const archivedCount = countByStatus('archived');

    const filteredUsers = filterUsers();

    const countOnlineOffline = () => {
        return users.filter(u =>
            u.status !== 'archived' &&
            (statusFilter === 'all' || u.status === statusFilter)
        );
    };

    const onlineOfflineFiltered = countOnlineOffline();
    const onlineCount = onlineOfflineFiltered.filter(u => u.activestatus).length;
    const offlineCount = onlineOfflineFiltered.filter(u => !u.activestatus).length;

    const getStatusColor = (activestatus) => {
        return activestatus ? 'green' : 'red';
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="main-content">
                    <h2>User Management</h2>

                    <div className="summary-row">
                        <div className="user-count-summary">
                            <div className="count-box"><span className="label">All Users</span><span className="count">{totalUsers}</span></div>
                            <div className="count-box"><span className="label">Registered</span><span className="count">{registeredCount}</span></div>
                            <div className="count-box"><span className="label">Guests</span><span className="count">{guestCount}</span></div>
                            <div className="count-box"><span className="label">Archived</span><span className="count">{archivedCount}</span></div>
                        </div>

                        <div className="online-status-summary">
                            <h3>User Online Status</h3>
                            <div className="status-filter">
                                <label>Filter by:</label>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="all">All</option>
                                    <option value="guest">Guests</option>
                                    <option value="registered">Registered</option>
                                </select>
                            </div>
                            <div className="status-counts">
                                <div className="count-box"><span className="label">Online</span><span className="count">{onlineCount}</span></div>
                                <div className="count-box"><span className="label">Offline</span><span className="count">{offlineCount}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="tab-bar">
                        <button onClick={() => setViewFilter('all')} className={viewFilter === 'all' ? 'tab active' : 'tab'}>All Users</button>
                        <button onClick={() => setViewFilter('registered')} className={viewFilter === 'registered' ? 'tab active' : 'tab'}>Registered</button>
                        <button onClick={() => setViewFilter('archived')} className={viewFilter === 'archived' ? 'tab active' : 'tab'}>Archived</button>
                    </div>

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
                                    <th>Contact Number</th>
                                    <th>Status</th>
                                    <th>Active Status</th>
                                    <th>User Type</th>
                                    <th>Registered Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.id}</td>
                                            <td>{user.email || '—'}</td>
                                            <td>{user.name || '—'}</td>
                                            <td>{user.age > 0 ? user.age : 'N/A'}</td>
                                            <td>{user.gender || '—'}</td>
                                            <td>{user.contactNumber || '—'}</td>
                                            <td>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</td>
                                            <td>
                                                <span style={{ color: getStatusColor(user.activestatus) }}>
                                                    {user.activestatus ? ' Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td>{user.status === 'registered' ? user.userType || 'N/A' : '—'}</td>
                                            <td>{user.registeredDate || 'N/A'}</td>
                                            <td>
                                                {user.status === 'registered' && (
                                                    <button className="archive-btn" onClick={() => handleWarnAndArchive(user.id)}>Archive</button>
                                                )}
                                                {user.status === 'archived' && (
                                                    <button className="archived-btn" disabled>Archived</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="11" className="no-data">No users found.</td>
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
