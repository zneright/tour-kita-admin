// pages/FeedbackReview.js
import React, { useState, useEffect } from "react";
import {
    collection, getDocs, query, orderBy,
    addDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import Drilldown from "../components/Drilldown";
import "./FeedbackReview.css";

const FeedbackReview = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Feature Feedback");
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                setFeedbackList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching feedback:", err);
            }
        };
        fetchFeedback();
    }, []);

    const handleReply = (feedback) => {
        setSelectedFeedback(feedback);
        setReplyMessage("");
    };

    const handleSendReply = async () => {
        if (!selectedFeedback) return;
        try {
            await addDoc(collection(db, "notifications"), {
                userId: selectedFeedback.userId,
                message: replyMessage,
                category: "Reply",
                timestamp: serverTimestamp(),
            });
            alert("Reply sent!");
            setSelectedFeedback(null);
            setReplyMessage("");
        } catch (err) {
            console.error("Error sending reply:", err);
        }
    };

    const filtered = feedbackList.filter((f) => {
        if (activeTab === "Feature Feedback" && f.feedbackType !== "App Feedback") return false;
        if (activeTab === "Location Feedback" && f.feedbackType !== "Location Feedback") return false;
        const term = searchTerm.toLowerCase();
        return (
            f.email?.toLowerCase().includes(term) ||
            f.feedback?.toLowerCase().includes(term) ||
            f.feature?.toLowerCase().includes(term) ||
            f.location?.toLowerCase().includes(term)
        );
    });

    return (
        <div className="feedback-review">
            <Sidebar />
            <div className="main-content">
                <h2>Feedback & Reviews</h2>

                <div className="tabs">
                    <button
                        className={activeTab === "Feature Feedback" ? "active" : ""}
                        onClick={() => setActiveTab("Feature Feedback")}
                    >
                        Feature Feedback
                    </button>
                    <button
                        className={activeTab === "Location Feedback" ? "active" : ""}
                        onClick={() => setActiveTab("Location Feedback")}
                    >
                        Location Feedback
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <table className="feedback-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Type</th>
                            <th>Feature/Location</th>
                            <th>Rating</th>
                            <th>Feedback</th>
                            <th>Image</th>
                            <th>Reply</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((f) => (
                            <tr key={f.id}>
                                <td>{f.email}</td>
                                <td>{f.feedbackType}</td>
                                <td>{f.feature || f.location}</td>
                                <td>{f.rating}</td>
                                <td>{f.feedback}</td>
                                <td>
                                    {f.image && (
                                        <img
                                            src={f.image}
                                            alt="feedback"
                                            className="feedback-image"
                                            onClick={() => setImagePreview(f.image)}
                                        />
                                    )}
                                </td>
                                <td>
                                    <button className="action-btn" onClick={() => handleReply(f)}>
                                        Reply
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Drilldown */}
                <Drilldown feedbackList={feedbackList} activeTab={activeTab} />

                {/* Reply Modal */}
                {selectedFeedback && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Reply to <span className="modal-email">{selectedFeedback.email}</span></h3>
                            <textarea
                                className="modal-textarea"
                                placeholder="Type your reply..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button className="send-btn" onClick={handleSendReply}>Send</button>
                                <button className="cancel-btn" onClick={() => setSelectedFeedback(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                    <div className="modal-overlay" onClick={() => setImagePreview(null)}>
                        <div className="modal-image-content">
                            <img src={imagePreview} alt="preview" className="modal-full-image" />
                            <button className="close-btn" onClick={() => setImagePreview(null)}>×</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackReview;
