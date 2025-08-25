import React, { useState, useEffect } from "react";
import "./EventsModal.css";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format } from "date-fns";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import EventFormModal from "./EventFormModal";

const EventModal = ({ event, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(event);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => setFormData(event), [event]);

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, "events", event.id));
            onClose();
            onUpdate();
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    const formatTime = (time) => {
        if (!time) return "—";
        const [h, m] = time.split(":").map(Number);
        if (isNaN(h) || isNaN(m)) return "—";
        const ampm = h >= 12 ? "PM" : "AM";
        const hours12 = h % 12 || 12;
        return `${hours12}:${m.toString().padStart(2, "0")} ${ampm}`;
    };



    const formatTimestamp = (ts) => {
        try {
            const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
            return format(date, "PPP p");
        } catch {
            return "N/A";
        }
    };

    return (
        <div className="event-modal-backdrop" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                {isEditing ? (
                    <EventFormModal
                        isOpen={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                        onCancel={() => setIsEditing(false)}
                        onUpdate={(updated) => {
                            setFormData(updated);
                            setIsEditing(false);
                        }}
                    />
                ) : (
                    <div className="modal-content">
                        {formData.imageUrl && (
                            <div className="image-wrapper" onClick={() => setShowPreview(true)}>
                                <img src={formData.imageUrl} alt={formData.title} className="event-image" />
                            </div>
                        )}

                        <div className="event-header">
                            <h2>{formData.title}</h2>
                            <span className={`event-badge ${formData.openToPublic ? "public" : "private"}`}>
                                {formData.openToPublic ? "Public" : "Private"}
                            </span>
                        </div>

                        <div className="event-info-cards">
                            <div className="info-card"><FaCalendarAlt /> {formData.date}</div>
                            <div className="info-card">
                                <FaClock /> {formatTime(formData.eventStartTime)} - {formatTime(formData.eventEndTime)}
                            </div>
                            <div className="info-card"><FaMapMarkerAlt /> {formData.locationName}</div>
                        </div>

                        <div className="event-description">
                            <h3>Description</h3>
                            <p>{formData.description}</p>
                        </div>

                        <div className="event-meta">
                            <p>Created: {formatTimestamp(formData.createdAt)}</p>
                            <p>Updated: {formatTimestamp(formData.updatedAt)}</p>
                        </div>

                        <div className="modal-actions">
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit</button>
                            <button className="delete-btn" onClick={handleDelete}>Delete</button>
                        </div>

                    </div>
                )}

                {showPreview && (
                    <div className="image-preview-backdrop" onClick={() => setShowPreview(false)}>
                        <img src={formData.imageUrl} alt={formData.title} className="image-preview" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventModal;
