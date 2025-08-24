import React, { useState, useEffect } from "react";
import "./EventsModal.css";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format, } from "date-fns";

import EventFormModal from "./EventFormModal";

const EventModal = ({ event, onClose, onUpdate }) => {
    const [setShowImagePreview] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(event);

    useEffect(() => {
        setFormData(event);
    }, [event]);


    const handleDelete = async () => {
        try {
            await deleteDoc(doc(db, "events", event.id));
            onClose();
            onUpdate();
        } catch (err) {
            console.error("Failed to delete event:", err);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return "—";
        const [hourStr, minuteStr] = timeString.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minuteStr} ${ampm}`;
    };


    const formatTimestamp = (timestamp) => {
        try {
            const date =
                typeof timestamp?.toDate === "function"
                    ? timestamp.toDate()
                    : new Date(timestamp);
            return format(date, "PPP p");
        } catch {
            return "N/A";
        }
    };


    return (
        <div className="event-modal-backdrop" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                    <EventFormModal
                        isOpen={isEditing}
                        formData={formData}
                        setFormData={setFormData}
                        onCancel={() => setIsEditing(false)}
                        onUpdate={(updatedEvent) => {
                            setFormData(updatedEvent);
                            setIsEditing(false);

                        }}
                    />
                ) : (
                    <>
                        {formData.imageUrl && (
                            <img
                                src={formData.imageUrl}
                                alt={formData.title}
                                className="event-image"
                                onClick={() => setShowImagePreview(true)}
                            />
                        )}

                        <h2>{formData.title}</h2>
                        <div className="event-details">
                            <p><strong>Description:</strong> {formData.description}</p>
                            <p><strong>Date:</strong> {formData.date}</p>
                            <p>
                                <strong>Time:</strong> {formatTime(formData.time)} - {formatTime(formData.endTime)}
                            </p>
                            <p><strong>Location Name:</strong> {formData.locationName}</p>
                            <p><strong>Created At:</strong> {formatTimestamp(formData.createdAt)}</p>
                            <p style={{ fontWeight: "bold", marginTop: "10px" }}>
                                {formData.openToPublic ? "✅ Open to Public" : "🔒 Private Event"}
                            </p>
                            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>
                                <em>Last updated: {formatTimestamp(formData.updatedAt)}</em>
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="button edit-btn"
                                onClick={() => {
                                    setFormData(event);
                                    setIsEditing(true);
                                }}
                            >
                                Edit
                            </button>
                            <button
                                className="button delete-btn"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </>
                )}
                <button onClick={onClose} className="close-btn">
                    ×
                </button>

            </div>
        </div>
    );
};

export default EventModal;
