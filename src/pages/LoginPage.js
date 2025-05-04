import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { FaUser, FaLock } from 'react-icons/fa';
import TourkitaLogo from '../components/TourkitaLogo.jpg';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await signInWithEmailAndPassword(auth, username.trim(), password);
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
        } catch (err) {
            console.error("Firebase Auth Error:", err.code, err.message);
            if (err.code === 'auth/user-not-found') {
                setError('No such user found. Please check your email.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email format.');
            } else {
                setError('Authentication failed. Please try again.');
            }
        }
    };

    return (
        <div className="login-container">
            {/* Animated dots */}
            <div className="marker-dot"></div>
            <div className="marker-dot"></div>
            <div className="marker-dot"></div>
            <div className="marker-dot"></div>
            <div className="marker-dot"></div>

            <div className="login-box">
                <img src={TourkitaLogo} alt="TourKita Logo" className="logo" />
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <FaUser className="input-icon" />
                        <input
                            type="email"
                            placeholder="EMAIL (e.g., admin@tourkita.com)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            placeholder="PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">LOGIN</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
