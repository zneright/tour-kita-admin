import React from "react";
import "./NotificationDetailsModal.css";

const NotificationDetailsModal = ({ notif, onClose, onEdit, onDelete }) => {
    if (!notif) return null;

    const hasValidSchedule =
        notif.schedule &&
        ((notif.schedule.toDate && !isNaN(notif.schedule.toDate().getTime())) ||
            (!isNaN(new Date(notif.schedule).getTime())));

    const scheduledText = notif.schedule
        ? notif.schedule.toDate
            ? notif.schedule.toDate().toLocaleString()
            : new Date(notif.schedule).toLocaleString()
        : "";

    return (
        <div className="notification-backdrop" onClick={onClose}>
            <div className="notification-modal" onClick={(e) => e.stopPropagation()}>

                <button className="notification-close-btn" onClick={onClose}>×</button>

                <div className="notification-header">
                    <h2>{notif.title}</h2>
                    <span className="notification-badge">{notif.audience}</span>
                </div>

                <div className="notification-info-row">
                    <div className="notification-info-item">
                        <strong>Category:</strong> {notif.category}
                    </div>
                    <div className="notification-info-item">
                        <strong>Created:</strong> {notif.timestamp?.toDate?.().toLocaleString?.() || "Unknown"}
                    </div>
                    {hasValidSchedule && (
                        <div className="notification-info-item">
                            <strong>Scheduled:</strong> {scheduledText}
                        </div>
                    )}
                </div>

                <div className="notification-description">
                    {notif.message.split("\n").map((line, index) => (
                        line.trim() && (
                            <p key={index} className="notification-paragraph">
                                {line}
                            </p>
                        )
                    ))}
                </div>


                {notif.imageUrl && (
                    <div className="notification-image-wrapper">
                        <img src={notif.imageUrl} alt="Notification" className="notification-image" />
                    </div>
                )}

                <div className="notification-actions">
                    <button
                        className="notification-button notification-edit-btn"
                        onClick={() => onEdit(notif)}
                    >
                        Edit
                    </button>
                    <button
                        className="notification-button notification-delete-btn"
                        onClick={() => onDelete(notif)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailsModal;
