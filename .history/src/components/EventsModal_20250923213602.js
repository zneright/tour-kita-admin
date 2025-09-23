import React, { useState, useEffect } from "react";
import "./EventsModal.css";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { format, parseISO, isSameDay } from "date-fns";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import EventFormModal from "./EventFormModal";

const EventModal = ({ event, onClose, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch event data directly from Firestore
    useEffect(() => {
        const fetchEvent = async () => {
            if (!event?.id) return;
            try {
                const docRef = doc(db, "events", event.id);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();

                    // Normalize times here
                    const formattedStartTime = data.eventStartTime
                        ? formatTime12Hour(data.eventStartTime)
                        : "";
                    const formattedEndTime = data.eventEndTime
                        ? formatTime12Hour(data.eventEndTime)
                        : "";

                    setFormData({
                        id: snap.id,
                        ...data,
                        eventStartTime: formattedStartTime,
                        eventEndTime: formattedEndTime,
                    });
                }
            } catch (err) {
                console.error("Error fetching event:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [event]);


    const convert12To24 = (time12h) => {
        if (!time12h) return "";
        const [time, modifier] = time12h.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    };

    const formatTime12Hour = (time24) => {
        if (!time24) return "";
        let [hours, minutes] = time24.split(":").map(Number);
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
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

    const formatDateRange = (start, end) => {
        if (!start && !end) return "N/A";
        const startDate = start ? parseISO(start) : null;
        const endDate = end ? parseISO(end) : null;

        if (startDate && endDate && isSameDay(startDate, endDate)) {
            return format(startDate, "PPP");
        }
        if (startDate && endDate) {
            return `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`;
        }
        return startDate ? format(startDate, "PPP") : format(endDate, "PPP");
    };

    const formatTimestamp = (ts) => {
        try {
            const date =
                typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
            return format(date, "PPP p");
        } catch {
            return "N/A";
        }
    };

    if (loading) {
        return (
            <div className="event-modal-backdrop" onClick={onClose}>
                <div className="event-modal">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="event-modal-backdrop" onClick={onClose}>
                <div className="event-modal">
                    <p>No event found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="event-modal-backdrop" onClick={onClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    ×
                </button>

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
                        <div className="event-header">
                            <h2>{formData.title}</h2>
                            <span
                                className={`event-badge ${formData.openToPublic ? "public" : "private"
                                    }`}
                            >
                                {formData.openToPublic
                                    ? "Public"
                                    : "Private"}
                            </span>
                        </div>

                        {formData.imageUrl && (
                            <div
                                className="image-wrapper"
                                onClick={() => setShowPreview(true)}
                            >
                                <img
                                    src={formData.imageUrl}
                                    alt={formData.title}
                                    className="event-image"
                                />
                            </div>
                        )}

                        <div className="event-info-cards">
                            <div className="info-card">
                                <FaCalendarAlt />{" "}
                                {formatDateRange(
                                    formData.startDate,
                                    formData.endDate
                                )}
                            </div>
                            <div className="info-card">
                                <FaClock />{" "}
                                {formData.eventStartTime} -{" "}
                                {formData.eventEndTime}
                            </div>
                            <div className="info-card">
                                <FaMapMarkerAlt />{" "}
                                {formData.customAddress || "N/A"}
                            </div>
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
                            <button
                                className="edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </button>
                            <button
                                className="delete-btn"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {showPreview && (
                    <div
                        className="image-preview-backdrop"
                        onClick={() => setShowPreview(false)}
                    >
                        <img
                            src={formData.imageUrl}
                            alt={formData.title}
                            className="image-preview"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventModal;
