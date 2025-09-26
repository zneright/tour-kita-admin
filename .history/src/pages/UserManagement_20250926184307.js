import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ExportButtons from '../components/ExportButtons';

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [statusFilter] = useState('all');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const registeredUsers = usersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.uid || doc.id,
                        email: data.email || '',
                        name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                        age: data.age || '',
                        gender: data.gender || '',
                        contactNumber: data.contactNumber || '',
                        status: 'registered',
                        activestatus: data.activestatus ?? false,
                        userType: data.userType || '',
                        registeredDate: data.createdAt
                            ? new Date(data.createdAt.toDate?.() || data.createdAt).toLocaleDateString()
                            : 'N/A',
                    };
                });

                const guestsSnapshot = await getDocs(collection(db, 'guests'));
                const guestUsers = guestsSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: data.guestId || doc.id,
                        email: '',
                        name: 'Guest User',
                        age: '',
                        gender: '',
                        contactNumber: '',
                        status: 'guest',
                        activestatus: data.activestatus ?? false,
                        userType: 'Guest',
                        registeredDate: data.createdAt
                            ? new Date(data.createdAt.toDate?.() || data.createdAt)
                            : null,
                    };
                });

                const allUsers = [...registeredUsers, ...guestUsers];
                setUsers(allUsers);
            } catch (error) {
                console.error('Error fetching users and guests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleArchive = async (userId, reason) => {
        if (!reason) return;

        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                alert('User not found.');
                return;
            }

            const userData = userSnap.data();

            const archivedUserRef = doc(db, 'archived_users', userId);
            await setDoc(archivedUserRef, {
                ...userData,
                email: userData.email || '',
                uid: userId,
                archivedAt: serverTimestamp(),
                archiveReason: reason,
            });

            await deleteDoc(userRef);

            const updatedUsers = users.map(user =>
                user.id === userId ? { ...user, status: 'archived' } : user
            );
            setUsers(updatedUsers);

            alert(`✅ User ${userData.email || userId} has been archived.`);

        } catch (error) {
            console.error('Error archiving user:', error);
            alert('Error archiving user. See console for details.');
        }
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

            const matchesDateFrom = dateFrom ? new Date(user.registeredDate) >= new Date(dateFrom) : true;
            const matchesDateTo = dateTo ? new Date(user.registeredDate) <= new Date(dateTo) : true;

            return matchesSearch && matchesFilter && matchesDateFrom && matchesDateTo;
        }).sort((a, b) => new Date(b.registeredDate) - new Date(a.registeredDate)); // newest first
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
                <h2>User Management</h2>
                <div className="main-content">


                    <div className="summary-row">
                        {loading ? (
                            <div className="user-count-summary">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="count-box skeleton"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="user-count-summary">
                                <div className="count-box"><span className="label">All Users</span><span className="count">{totalUsers}</span></div>
                                <div className="count-box"><span className="label">Registered</span><span className="count">{registeredCount}</span></div>
                                <div className="count-box"><span className="label">Guests</span><span className="count">{guestCount}</span></div>
                                <div className="count-box"><span className="label">Archived</span><span className="count">{archivedCount}</span></div>
                            </div>
                        )}

                        <div className="online-status-summary">
                            <h3>User Online Status</h3>
                            {loading ? (
                                <div className="status-counts">
                                    <div className="count-box skeleton"></div>
                                    <div className="count-box skeleton"></div>
                                </div>
                            ) : (
                                <div className="status-counts">
                                    <div className="count-box"><span className="label">Online</span><span className="count">{onlineCount}</span></div>
                                    <div className="count-box"><span className="label">Offline</span><span className="count">{offlineCount}</span></div>
                                </div>
                            )}
                        </div>
                    </div>


                    <div className="tab-export-row">
                        <div className="tab-bar markers-tabs">
                            {['all', 'registered', 'archived'].map(tab => (
                                <button
                                    key={tab}
                                    className={`mtab ${viewFilter === tab ? 'active' : ''}`}
                                    onClick={() => setViewFilter(tab)}
                                >
                                    {tab === 'all' ? 'All Users' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="export-buttons-container">
                            <ExportButtons users={users} />
                        </div>
                    </div>


                    <ExportButtons users={users} />

                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by name, email or ID"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="date-filter"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="date-filter"
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
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(11)].map((_, j) => (
                                                <td key={j}><div className="skeleton skeleton-line"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    filteredUsers.length > 0 ? (
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
                                                <td>{user.registeredDate ? new Date(user.registeredDate).toLocaleDateString() : 'N/A'}</td>
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
                                    )
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
