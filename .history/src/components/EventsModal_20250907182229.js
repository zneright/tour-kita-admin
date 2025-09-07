import React, { useState } from "react";
import "./EventsModal.css";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaRedo } from "react-icons/fa";
import EventFormModal from "./EventFormModal";

const EventModal = ({ event, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, "events", event.id));
            onClose();
            onUpdate();
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    const formatTimestamp = (ts) => {
        try {
            const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
            return format(date, "PPP p");
        } catch {
            return "N/A";
        }
    };

    const renderRecurrence = (rec) => {
        if (!rec?.frequency) return "None";

        const days = rec.daysOfWeek?.length
            ? rec.daysOfWeek.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")
            : "All days";

        return `${rec.frequency.charAt(0).toUpperCase() + rec.frequency.slice(1)} • ${days} • ${rec.startDate} → ${rec.endDate}`;
    };

    return (
        <div className="event-modal-backdrop" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                {isEditing ? (
                    <EventFormModal
                        isOpen={isEditing}
                        formData={event}
                        setFormData={() => { }}
                        onCancel={() => setIsEditing(false)}
                        onUpdate={() => setIsEditing(false)}
                    />
                ) : (
                    <div className="modal-content">
                        <div className="event-header">
                            <h2>{event.title}</h2>
                            <span className={`event-badge ${event.openToPublic ? "public" : "private"}`}>
                                {event.openToPublic ? "Public" : "Private"}
                            </span>
                        </div>

                        {event.imageUrl && (
                            <div className="image-wrapper" onClick={() => setShowPreview(true)}>
                                <img src={event.imageUrl} alt={event.title} className="event-image" />
                            </div>
                        )}

                        <div className="event-info-cards">
                            <div className="info-card">
                                <FaCalendarAlt /> {event.startDate} → {event.endDate}
                            </div>
                            <div className="info-card">
                                <FaClock /> {event.eventStartTime} - {event.eventEndTime}
                            </div>
                            {event.customAddress && (
                                <div className="info-card">
                                    <FaMapMarkerAlt /> {event.customAddress}
                                </div>
                            )}
                            {event.recurrence && (
                                <div className="info-card">
                                    <FaRedo /> {renderRecurrence(event.recurrence)}
                                </div>
                            )}
                        </div>

                        <div className="event-description">
                            <h3>Description</h3>
                            <p>{event.description}</p>
                        </div>

                        <div className="event-meta">
                            <p>Created: {formatTimestamp(event.createdAt)}</p>
                            <p>Updated: {formatTimestamp(event.updatedAt)}</p>
                        </div>

                        <div className="modal-actions">
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                            <button className="delete-btn" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                )}

                {showPreview && (
                    <div className="image-preview-backdrop" onClick={() => setShowPreview(false)}>
                        <img src={event.imageUrl} alt={event.title} className="image-preview" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventModal;
