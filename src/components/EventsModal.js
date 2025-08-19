import React, { useState, useEffect } from "react";
import "./EventsModal.css";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format, parse } from "date-fns";

const EventModal = ({ event, onClose, onUpdate }) => {
    const [showImagePreview, setShowImagePreview] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedEvent, setEditedEvent] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            const formatForInput = (time) => {
                if (!time) return "";
                try {
                    if (typeof time?.toDate === "function") {
                        return format(time.toDate(), "HH:mm");
                    }
                    return format(parse(time, "h:mm a", new Date()), "HH:mm");
                } catch {
                    return time;
                }
            };

            setEditedEvent({
                title: event.title || "",
                description: event.description || "",
                date: event.date || "",
                time: formatForInput(event.time),
                endTime: formatForInput(event.endTime),
                imageUrl: event.imageUrl || "",
                openToPublic: event.openToPublic || false,
                locationName: event.locationName || ""
            });
        }
    }, [event]);


    if (!event) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditedEvent((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const eventRef = doc(db, "events", event.id);
            await updateDoc(eventRef, {
                ...editedEvent,
                updatedAt: new Date(),
            });
            onUpdate();
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update event:", err);
        } finally {
            setLoading(false);
        }
    };

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
        try {
            const parsed = parse(timeString, "HH:mm", new Date());
            return format(parsed, "h:mm a");
        } catch {
            return timeString;
        }
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

    const lastUpdated = event.updatedAt || event.createdAt;

    return (
        <div className="event-modal-backdrop" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                {isEditing ? (
                    <div className="event-details">
                        {editedEvent.imageUrl && (
                            <img
                                src={editedEvent.imageUrl}
                                alt={editedEvent.title}
                                className="event-image"
                            />
                        )}

                        <label><strong>Title:</strong></label>
                        <input
                            type="text"
                            name="title"
                            value={editedEvent.title}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <label><strong>Description:</strong></label>
                        <textarea
                            name="description"
                            value={editedEvent.description}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <label><strong>Date:</strong></label>
                        <input
                            type="date"
                            name="date"
                            value={editedEvent.date}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <label><strong>Start Time:</strong></label>
                        <input
                            type="time"
                            name="time"
                            value={editedEvent.time}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <label><strong>End Time:</strong></label>
                        <input
                            type="time"
                            name="endTime"
                            value={editedEvent.endTime}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <label><strong>Image URL:</strong></label>
                        <input
                            type="text"
                            name="imageUrl"
                            value={editedEvent.imageUrl}
                            onChange={handleChange}
                            className="event-input"
                            disabled={loading}
                        />

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="openToPublic"
                                    checked={editedEvent.openToPublic}
                                    onChange={handleChange}
                                    disabled={loading}
                                />{" "}
                                Open to the public?
                            </label>
                        </div>

                        <div className="form-group">
                            <label><strong>Location Name:</strong></label>
                            <input
                                type="text"
                                name="locationName"
                                value={editedEvent.locationName}
                                onChange={handleChange}
                                className="event-input"
                                disabled={loading}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                className="button save-btn"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                            <button
                                className="button cancel-btn"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {event.imageUrl && (
                            <>
                                <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="event-image"
                                    onClick={() => setShowImagePreview(true)}
                                />
                                {showImagePreview && (
                                    <div
                                        className="image-preview-backdrop"
                                        onClick={() => setShowImagePreview(false)}
                                    >
                                        <img
                                            src={event.imageUrl}
                                            alt="Full Preview"
                                            className="image-preview-modal"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        <h2>{event.title}</h2>
                        <div className="event-details">
                            <p><strong>Description:</strong> {event.description}</p>
                            <p><strong>Date:</strong> {event.date}</p>
                            <p>
                                <strong>Time:</strong> {formatTime(event.time)} - {formatTime(event.endTime)}
                            </p>
                            <p><strong>Location Name:</strong> {event.locationName}</p>
                            <p><strong>Created At:</strong> {formatTimestamp(event.createdAt)}</p>
                            <p style={{ fontWeight: "bold", marginTop: "10px" }}>
                                {event.openToPublic ? "✅ Open to Public" : "🔒 Private Event"}
                            </p>
                            <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>
                                <em>Last updated: {formatTimestamp(lastUpdated)}</em>
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="button edit-btn"
                                onClick={() => setIsEditing(true)}
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
                    Close
                </button>
            </div>
        </div>
    );
};

export default EventModal;
