import React, { useEffect, useState } from "react";
import "./MarkerFormModal.css";
import {
    getDocs,
    collection,
    addDoc, doc, updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";

const CLOUDINARY_UPLOAD_PRESET = "Events image";
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";

const EventFormModal = ({ isOpen, formData, setFormData, onCancel, onUpdate }) => {
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [locations, setLocations] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    useEffect(() => {
        const fetchMarkers = async () => {
            setLoadingLocations(true);
            try {
                const snapshot = await getDocs(collection(db, "markers"));
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setLocations(data);
            } catch (error) {
                console.error("Error fetching locations:", error);
            } finally {
                setLoadingLocations(false);
            }
        };

        if (isOpen) fetchMarkers();
    }, [isOpen]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleImageUpload = async () => {
        if (!imageFile) return null;

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("file", imageFile);
        formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const res = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                formDataUpload
            );
            return res.data.secure_url;
        } catch (err) {
            console.error("Image upload failed:", err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (submitting || uploading) return;

        try {
            setSubmitting(true);
            let imageUrl = formData.imageUrl || "";

            if (imageFile) {
                const uploadedUrl = await handleImageUpload();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }
            if (formData.id) {
                const eventRef = doc(db, "events", formData.id);
                await updateDoc(eventRef, {
                    title: formData.title,
                    date: formData.date,
                    time: formData.time?.slice(0, 5),
                    endTime: formData.endTime?.slice(0, 5),
                    openToPublic: !!formData.openToPublic,
                    locationId: formData.locationId,
                    description: formData.description,
                    imageUrl: imageUrl,
                    updatedAt: new Date()
                });

                if (onUpdate) {
                    onUpdate({
                        ...formData,
                        imageUrl,
                        updatedAt: new Date()
                    });
                }
            } else {
                const docRef = await addDoc(collection(db, "events"), {
                    title: formData.title,
                    date: formData.date,
                    time: formData.time?.slice(0, 5),
                    endTime: formData.endTime?.slice(0, 5),
                    openToPublic: !!formData.openToPublic,
                    locationId: formData.locationId,
                    description: formData.description,
                    imageUrl: imageUrl,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                if (onUpdate) {
                    onUpdate();
                }

            }

            if (!formData.id) {
                setFormData({
                    title: "",
                    description: "",
                    date: "",
                    time: "",
                    endTime: "",
                    openToPublic: false,
                    locationId: "",
                    imageUrl: ""
                });
            }

            setImageFile(null);
            onCancel();
        } catch (error) {
            console.error("Error saving event:", error);
        } finally {
            setSubmitting(false);
        }

    };
    if (!isOpen) return null;

    const isDisabled = loadingLocations || uploading || submitting;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>
                    {loadingLocations ? "Loading Form..." :
                        formData?.id || formData?.eventId ? "Edit Event" : "Add New Event"}
                </h2>


                <form onSubmit={handleSubmit} className="marker-form">
                    <div className="field-group full-width">
                        <label htmlFor="locationId">Select Location:</label>
                        <select
                            name="locationId"
                            id="locationId"
                            value={formData.locationId}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        >
                            <option value="">-- Choose a location --</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="field-group full-width">
                        <label htmlFor="title">Event Title:</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        />
                    </div>

                    <div className="field-group full-width">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            name="description"
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="date">Date:</label>
                        <input
                            type="date"
                            name="date"
                            id="date"
                            value={formData.date}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="time">Start Time:</label>
                        <input
                            type="time"
                            name="time"
                            id="time"
                            value={formData.time.slice(0, 5)}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        />

                    </div>

                    <div className="field-group">
                        <label htmlFor="endTime">End Time:</label>
                        <input
                            type="time"
                            name="endTime"
                            id="endTime"
                            value={formData.endTime.slice(0, 5)}
                            onChange={handleChange}
                            disabled={isDisabled}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label>
                            <input
                                type="checkbox"
                                name="openToPublic"
                                checked={formData.openToPublic || false}
                                onChange={handleChange}
                                disabled={isDisabled}
                            />{" "}
                            Open to the public?
                        </label>
                    </div>

                    <div className="field-group full-width">
                        <label>Upload Image (optional):</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files[0])}
                            disabled={isDisabled}
                        />
                        <small>Or paste a direct image URL below:</small>
                        <input
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl || ""}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            disabled={isDisabled}
                        />
                    </div>

                    <div className="form-actions full-width">
                        <button
                            type="submit"
                            className="save-button"
                            disabled={isDisabled}

                        >
                            {loadingLocations
                                ? "Loading..."
                                : uploading
                                    ? "Uploading..."
                                    : submitting
                                        ? "Saving..."
                                        : "Save Event"}

                        </button>
                        <button
                            type="button"
                            className="cancel-butn"
                            onClick={onCancel}
                            disabled={isDisabled}

                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;
