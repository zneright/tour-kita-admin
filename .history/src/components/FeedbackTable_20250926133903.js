// components/FeedbackTable.js
import React from "react";

const FeedbackTable = ({
    loading,
    feedback,
    isAllTab,
    isFeatureTab,
    renderStars,
    formatTimestamp,
    onImageClick,
    onSendMessage,
}) => {
    return (
        <table className="feedback-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Email</th>
                    {isAllTab && <th>App Feature</th>}
                    <th>{isFeatureTab ? "App Feature" : "Location"}</th>
                    <th>Feedback</th>
                    <th>Image</th>
                    <th>Rating</th>
                    <th>Time</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i}>
                            <td colSpan="9">
                                <div className="skeleton-card">
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-line medium"></div>
                                    <div className="skeleton skeleton-line"></div>
                                    <div className="skeleton skeleton-line short"></div>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : feedback.length > 0 ? (
                    feedback.map((entry, index) => (
                        <tr key={entry.id}>
                            <td>{index + 1}</td>
                            <td>{entry.email}</td>
                            {isAllTab && (
                                <td>
                                    {entry.feedbackType === "App Feedback"
                                        ? entry.feature || "N/A"
                                        : "—"}
                                </td>
                            )}
                            <td>{isFeatureTab ? entry.feature || "—" : entry.location || "—"}</td>
                            <td>{entry.comment}</td>
                            <td>
                                {entry.imageUrl ? (
                                    <img
                                        src={entry.imageUrl}
                                        alt="Feedback"
                                        className="feedback-image"
                                        onClick={() => onImageClick(entry.imageUrl)}
                                    />
                                ) : (
                                    "—"
                                )}
                            </td>
                            <td>{renderStars(entry.rating || 0)}</td>
                            <td>{formatTimestamp(entry.createdAt)}</td>
                            <td>
                                <button
                                    className="action-btn"
                                    onClick={() =>
                                        onSendMessage(entry.email, isFeatureTab ? entry.feature : entry.location)
                                    }
                                >
                                    Send Message
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                            No feedback found.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default FeedbackTable;
