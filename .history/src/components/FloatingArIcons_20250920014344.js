import React, { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaStar, FaBinoculars, FaRoute } from 'react-icons/fa';

const icons = [FaMapMarkerAlt, FaStar, FaBinoculars, FaRoute];

const FloatingARIcons = () => {
    const [positions, setPositions] = useState(
        icons.map(() => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }))
    );

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPositions((prev) =>
                prev.map((pos, i) => ({
                    x: pos.x + (e.clientX - window.innerWidth / 2) * 0.01 * (i + 1),
                    y: pos.y + (e.clientY - window.innerHeight / 2) * 0.01 * (i + 1),
                }))
            );
        };

        const interval = setInterval(() => {
            setPositions((prev) =>
                prev.map((pos) => ({
                    x: pos.x + (Math.random() - 0.5) * 1.2,
                    y: pos.y + (Math.random() - 0.5) * 1.2,
                }))
            );
        }, 30);

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(interval);
        };
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
            {icons.map((Icon, i) => (
                <Icon
                    key={i}
                    style={{
                        position: 'absolute',
                        left: positions[i].x,
                        top: positions[i].y,
                        color: '#ffd700aa',
                        fontSize: 28,
                        transform: 'translate(-50%, -50%)',
                        transition: 'all 0.1s ease',
                    }}
                />
            ))}
        </div>
    );
};

export default FloatingARIcons;
