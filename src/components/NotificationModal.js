import React, { useState, useEffect } from "react";
import axios from "axios";
import { db } from "../firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import "./NotificationModal.css";

const NotificationModal = ({ isOpen, onClose, onSaved, editingData }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [category, setCategory] = useState("updates");
    const [audience, setAudience] = useState("all");
    const [charCount, setCharCount] = useState(0);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const resetForm = () => {
        setTitle("");
        setMessage("");
        setCharCount(0);
        setCategory("updates");
        setAudience("all");
        setImageFile(null);
        setImagePreview("");
        setImageUrl("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };
    useEffect(() => {
        if (editingData) {
            setTitle(editingData.title || "");
            setMessage(editingData.message || "");
            setCharCount(editingData.message?.length || 0);
            setCategory(editingData.category || "updates");
            setAudience(editingData.audience || "all");
            setImagePreview(editingData.imageUrl || "");
            setImageUrl(editingData.imageUrl || "");
        }
    }, [editingData]);


    const handleImageUpload = async () => {
        // If user selected a file, upload to Cloudinary
        if (imageFile) {
            const formData = new FormData();
            formData.append("file", imageFile);
            formData.append("upload_preset", "Notification Image");
            try {
                const res = await axios.post(
                    "https://api.cloudinary.com/v1_1/dupjdmjha/image/upload",
                    formData
                );
                return res.data.secure_url;
            } catch (err) {
                console.error("Cloudinary Upload Failed:", err);
                return null;
            }
        }

        if (imageUrl && !imageFile) {
            return imageUrl;
        }

        return editingData?.imageUrl || null;
    };


    const handleSend = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            alert("Please fill out both the title and message.");
            return;
        }

        setLoading(true);

        try {
            const imageUrl = await handleImageUpload();

            if (editingData) {
                await db.collection("notifications").doc(editingData.id).update({
                    title,
                    message,
                    category,
                    audience,
                    imageUrl: imageUrl || "",
                    timestamp: Timestamp.now(),

                });
                alert("Notification updated successfully!");
            } else {
                await addDoc(collection(db, "notifications"), {
                    title,
                    message,
                    category,
                    audience,
                    imageUrl: imageUrl || "",
                    timestamp: Timestamp.now(),

                });
                alert(`Notification sent to ${audience}`);
            }

            setTitle("");
            setMessage("");
            setCharCount(0);
            setCategory("updates");
            setAudience("all");
            setImageFile(null);

            resetForm();
            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error("Error sending/updating notification:", error);
            alert("Failed to send/update notification.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="notification-popup scrollable-popup">
                <form className="popup-content" onSubmit={handleSend}>
                    <h3>{editingData ? "Edit Notification" : "Create Notification"}</h3>

                    <label>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <label>Message</label>
                    <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setCharCount(e.target.value.length);
                        }}
                    />
                    <small>{charCount} characters</small>

                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="updates">Updates</option>
                        <option value="promotions">Promotions</option>
                        <option value="reminders">Reminders</option>
                        <option value="alerts">Alerts</option>
                    </select>

                    <label>Audience</label>
                    <select value={audience} onChange={(e) => setAudience(e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="registered">Registered Users</option>
                        <option value="guest">Guest Users</option>
                    </select>

                    <label>Upload Image</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files[0];
                            setImageFile(file);
                            const preview = URL.createObjectURL(file);
                            setImagePreview(preview);

                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("upload_preset", "Notification Image");
                            try {
                                const res = await axios.post(
                                    "https://api.cloudinary.com/v1_1/dupjdmjha/image/upload",
                                    formData
                                );
                                setImageUrl(res.data.secure_url);
                            } catch (err) {
                                console.error("Cloudinary Upload Failed:", err);
                                alert("Image upload failed");
                            }
                        }}
                    />

                    <label>Image URL</label>
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => {
                            const url = e.target.value;
                            setImageUrl(url);
                            setImagePreview(url);
                        }}
                        placeholder="Image URL will appear here"
                    />
                    {imagePreview && (
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ width: "100%", marginTop: 10 }}
                        />
                    )}


                    <div className="popup-actions">
                        <button
                            type="submit"
                            className="save-btn"
                            disabled={loading}
                        >
                            {loading ? (editingData ? "Updating..." : "Sending...") : (editingData ? "Update" : "Save")}
                        </button>
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default NotificationModal;
