import React, { useState } from "react";
import "./FeedbackTable.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

const FeedbackTable = ({
    loading,
    feedback,
    isAllTab,
    isFeatureTab,
    renderStars,
    formatTimestamp,
    onImageClick,
    onSendMessage,
    searchTerm,
    setSearchTerm,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    filterContext,
    setFilterContext,
}) => {

    // Extract unique locations/features for the filter dropdown
    const options = Array.from(
        new Set(feedback.map(f => f.feature || f.location))
    ).filter(Boolean);

    // Filter feedback based on search, context filter, and date range
    const filteredFeedback = feedback.filter(item => {
        const matchesSearch =
            item.email?.toLowerCase().includes(searchTerm.toLowerCase())
                (item.location || item.feature)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.comment?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesContext = filterContext
            ? item.location === filterContext || item.feature === filterContext
            : true;

        const itemDate = new Date(item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt);
        const matchesDate =
            (!startDate || itemDate >= new Date(startDate)) &&
            (!endDate || itemDate <= new Date(endDate));

        return matchesSearch && matchesContext && matchesDate;
    });

    // Export to PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();
        doc.setFontSize(14);
        doc.text("Feedback Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 22);

        const tableColumn = [
            "No",
            "Email",
            ...(isAllTab ? ["App Feature"] : []),
            isFeatureTab ? "App Feature" : "Location",
            "Feedback",
            "Rating",
            "Time",
        ];

        const tableRows = filteredFeedback.map((entry, index) => [
            index + 1,
            entry.email,
            ...(isAllTab ? [entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—"] : []),
            isFeatureTab ? entry.feature || "—" : entry.location || "—",
            entry.comment,
            entry.rating || 0,
            formatTimestamp(entry.createdAt),
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: "striped",
            styles: { fontSize: 9 },
        });

        doc.save(`feedback_report_${new Date().getTime()}.pdf`);
    };

    // Export to Excel
    const handleExportExcel = () => {
        const data = filteredFeedback.map((entry, index) => ({
            No: index + 1,
            Email: entry.email,
            ...(isAllTab ? { "App Feature": entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—" } : {}),
            [isFeatureTab ? "App Feature" : "Location"]: isFeatureTab ? entry.feature || "—" : entry.location || "—",
            Feedback: entry.comment,
            Rating: entry.rating || 0,
            Time: formatTimestamp(entry.createdAt),
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
        XLSX.writeFile(workbook, `feedback_report_${new Date().getTime()}.xlsx`);
    };

    return (
        <div>
            <div className="table-controls">
                {/* Search Input */}
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Search by email, feature/location, message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Filter by Location/Feature */}
                <select
                    className="filter-select"
                    value={filterContext}
                    onChange={(e) => setFilterContext(e.target.value)}
                >
                    <option value="">All Locations / Features</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>

                {/* Date Range */}
                <div className="date-range">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span>–</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                {/* Export Buttons */}
                <div className="export-buttons-container">
                    <button onClick={handleExportPDF} className="export-btn pdf">
                        <FaFilePdf /> Export PDF
                    </button>
                    <button onClick={handleExportExcel} className="export-btn excel">
                        <FaFileExcel /> Export Excel
                    </button>
                </div>
            </div>

            <table className="feedback-table">
                <thead>
                    <tr>
                        <th>No</th>
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
                    ) : filteredFeedback.length > 0 ? (
                        filteredFeedback.map((entry, index) => (
                            <tr key={entry.id}>
                                <td>{index + 1}</td>
                                <td>{entry.email}</td>
                                {isAllTab && (
                                    <td>{entry.feedbackType === "App Feedback" ? entry.feature || "N/A" : "—"}</td>
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
        </div>
    );
};

export default FeedbackTable;
