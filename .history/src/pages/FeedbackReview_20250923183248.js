import React, { useState, useEffect, useMemo } from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import "./FeedbackReview.css";
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    eachWeekOfInterval,
    format,
    getYear,
} from "date-fns";

const DRILL_LEVELS = ["yearly", "quarterly", "monthly", "weekly", "daily", "table"];

const FeedbackReview = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Location Feedback");
    const [feedbackList, setFeedbackList] = useState([]);
    const [averageRating, setAverageRating] = useState("N/A");
    const [mostLovedLocation, setMostLovedLocation] = useState("N/A");
    const [areaOfConcern, setAreaOfConcern] = useState("N/A");
    const [mostLovedFeature, setMostLovedFeature] = useState("N/A");
    const [areaOfConcernFeature, setAreaOfConcernFeature] = useState("N/A");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [selectedFeatureOrLocation, setSelectedFeatureOrLocation] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const maxDisplay = 20;
    const [isExpanded, setIsExpanded] = useState(false);

    const [drillState, setDrillState] = useState({
        level: "yearly",
        year: null,
        quarterObj: null,
        monthObj: null,
        weekObj: null,
        dayObj: null,
    });

    const isFeatureTab = activeTab === "Feature Feedback";
    const isLocationTab = activeTab === "Location Feedback";
    const isAllTab = activeTab === "All Feedback";

    // Convert timestamp to Date
    const asDate = (tsOrDate) => {
        if (!tsOrDate) return null;
        if (tsOrDate.toDate) return tsOrDate.toDate();
        if (tsOrDate instanceof Date) return tsOrDate;
        return new Date(tsOrDate);
    };

    // Fetch feedbacks
    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setFeedbackList(data);
                calculateStats(data, activeTab);
            } catch (err) {
                console.error("fetchFeedback error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    useEffect(() => {
        calculateStats(feedbackList, activeTab);
    }, [activeTab, feedbackList]);

    // Calculate summary stats
    const calculateStats = (data, tabType) => {
        let filtered;
        if (tabType === "Feature Feedback") {
            filtered = data.filter((i) => i.feedbackType === "App Feedback");
            setMostLovedFeature("N/A");
            setAreaOfConcernFeature("N/A");
        } else if (tabType === "Location Feedback") {
            filtered = data.filter((i) => i.feedbackType === "Location Feedback");
            setMostLovedLocation("N/A");
            setAreaOfConcern("N/A");
        } else {
            filtered = data;
            setMostLovedFeature("N/A");
            setAreaOfConcernFeature("N/A");
            setMostLovedLocation("N/A");
            setAreaOfConcern("N/A");
        }

        const avg = filtered.reduce((acc, cur) => acc + (cur.rating || 0), 0) / filtered.length;
        setAverageRating(isNaN(avg) ? "N/A" : avg.toFixed(1));

        const categoryRatings = {};
        filtered.forEach((item) => {
            const key = item.feature || item.location;
            if (key) {
                if (!categoryRatings[key]) categoryRatings[key] = [];
                categoryRatings[key].push(item.rating || 0);
            }
        });

        const averages = Object.entries(categoryRatings).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }));

        if (averages.length) {
            averages.sort((a, b) => b.avg - a.avg);
            if (tabType === "Feature Feedback") {
                setMostLovedFeature(averages[0].key);
                setAreaOfConcernFeature(averages[averages.length - 1].key);
            } else if (tabType === "Location Feedback") {
                setMostLovedLocation(averages[0].key);
                setAreaOfConcern(averages[averages.length - 1].key);
            }
        }
    };

    // Search & filter
    const filteredFeedback = feedbackList.filter(
        (item) =>
            (isAllTab ||
                (isFeatureTab && item.feedbackType === "App Feedback") ||
                (isLocationTab && item.feedbackType === "Location Feedback")) &&
            (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.location || item.feature)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.createdAt?.toDate?.().toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.rating?.toString().includes(searchTerm))
    );

    const displayedFeedback = filteredFeedback.slice(0, displayCount);
    const handleShowMore = () => {
        setDisplayCount(Math.min(filteredFeedback.length, maxDisplay));
        setIsExpanded(true);
    };
    const handleShowLess = () => {
        setDisplayCount(5);
        setIsExpanded(false);
    };
    useEffect(() => setDisplayCount(5), [activeTab, searchTerm]);

    const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);
    const formatTimestamp = (timestamp) =>
        timestamp?.toDate ? timestamp.toDate().toLocaleString() : "N/A";

    // Send message
    const sendMessage = async () => {
        if (!messageText.trim()) return alert("Message cannot be empty.");
        setIsSending(true);
        try {
            await addDoc(collection(db, "adminMessages"), {
                to: selectedUserEmail,
                message: messageText,
                context: selectedFeatureOrLocation,
                contextType: isFeatureTab ? "Feature" : "Location",
                sentAt: serverTimestamp(),
            });
            alert("Message sent successfully!");
            setIsModalOpen(false);
            setMessageText("");
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    // Utilities
    const entriesFor = (start, end) =>
        feedbackList.filter((f) => {
            const d = asDate(f.createdAt);
            if (!d) return false;
            if (start && end && !(d >= start && d <= end)) return false;
            if (!isAllTab) {
                if (isFeatureTab && f.feedbackType !== "App Feedback") return false;
                if (isLocationTab && f.feedbackType !== "Location Feedback") return false;
            }
            return true;
        });

    const avgPerKey = (items, type = "auto") => {
        const map = {};
        items.forEach((it) => {
            const key =
                type === "feature"
                    ? it.feature || "N/A"
                    : type === "location"
                        ? it.location || "N/A"
                        : it.feature || it.location || "N/A";
            if (!map[key]) map[key] = [];
            if (it.rating != null) map[key].push(it.rating);
        });
        return Object.entries(map)
            .map(([key, ratings]) => ({
                key,
                avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
                count: ratings.length,
            }))
            .sort((a, b) => b.avg - a.avg);
    };

    // Drill navigation
    const drillTo = (level, obj = {}) => setDrillState((prev) => ({ ...prev, level, ...obj }));
    const backLevel = () => {
        const idx = DRILL_LEVELS.indexOf(drillState.level);
        if (idx > 0) drillTo(DRILL_LEVELS[idx - 1]);
    };

    // Drill data generators
    const years = useMemo(() => {
        const set = new Set(feedbackList.map((f) => getYear(asDate(f.createdAt))));
        set.add(getYear(new Date()));
        return Array.from(set).sort((a, b) => b - a);
    }, [feedbackList]);

    const quartersForYear = (year) => {
        return [1, 2, 3, 4].map((q) => {
            const start = startOfQuarter(new Date(year, (q - 1) * 3, 1));
            const end = endOfQuarter(start);
            return { quarter: q, label: `Q${q} ${year}`, start, end, entries: entriesFor(start, end) };
        });
    };

    const monthsForQuarter = (year, quarter) => {
        const startMonth = (quarter - 1) * 3;
        return [0, 1, 2].map((m) => {
            const start = startOfMonth(new Date(year, startMonth + m, 1));
            const end = endOfMonth(start);
            return { year, monthIndex: start.getMonth(), label: format(start, "LLLL yyyy"), start, end, entries: entriesFor(start, end) };
        });
    };

    const weeksForMonth = (year, monthIndex) => {
        const start = startOfMonth(new Date(year, monthIndex, 1));
        const end = endOfMonth(start);
        return eachWeekOfInterval({ start, end }).map((wkStart, i) => {
            const wkEnd = endOfWeek(wkStart);
            return { week: i + 1, start: wkStart, end: wkEnd, label: `${format(wkStart, "MMM d")} - ${format(wkEnd, "MMM d")}`, entries: entriesFor(wkStart, wkEnd) };
        });
    };

    const daysForWeekRange = (start, end) => {
        return eachDayOfInterval({ start, end }).map((day) => ({
            label: format(day, "EEE MMM d"),
            start: day,
            end: day,
            entries: entriesFor(day, day),
        }));
    };

    const feedbackForCurrentTable = () => {
        switch (drillState.level) {
            case "table":
                if (drillState.dayObj?.entries) return drillState.dayObj.entries;
                if (drillState.weekObj?.entries) return drillState.weekObj.entries;
                if (drillState.monthObj?.entries) return drillState.monthObj.entries;
                if (drillState.quarterObj?.entries) return drillState.quarterObj.entries;
                if (drillState.year) return entriesFor(startOfYear(new Date(drillState.year, 0, 1)), endOfYear(new Date(drillState.year, 0, 1)));
                break;
            default:
                return [];
        }
        return [];
    };

    const getDrillEntries = () => {
        const { level, year, quarterObj, monthObj, weekObj, dayObj } = drillState;
        switch (level) {
            case "yearly":
                return years.map((y) => ({ label: `${y}`, year: y }));
            case "quarterly":
                return quartersForYear(year);
            case "monthly":
                return monthsForQuarter(quarterObj.year, quarterObj.quarter);
            case "weekly":
                return weeksForMonth(monthObj.year, monthObj.monthIndex);
            case "daily":
                return daysForWeekRange(weekObj.start, weekObj.end);
            case "table":
                return feedbackForCurrentTable();
            default:
                return [];
        }
    };

    const DrillView = () => {
        const entries = getDrillEntries();
        if (drillState.level === "table") {
            return (
                <table className="feedback-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Email</th>
                            <th>{isFeatureTab ? "App Feature" : "Location"}</th>
                            <th>Feedback</th>
                            <th>Image</th>
                            <th>Rating</th>
                            <th>Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length ? (
                            entries.map((f, i) => (
                                <tr key={f.id || i}>
                                    <td>{i + 1}</td>
                                    <td>{f.email}</td>
                                    <td>{isFeatureTab ? f.feature || "N/A" : f.location || "N/A"}</td>
                                    <td>{f.comment}</td>
                                    <td>
                                        {f.imageUrl && (
                                            <img
                                                src={f.imageUrl}
                                                alt="Feedback"
                                                className="feedback-image"
                                                onClick={() => {
                                                    setImagePreview(f.imageUrl);
                                                    setShowImageModal(true);
                                                }}
                                            />
                                        )}
                                    </td>
                                    <td>{renderStars(f.rating || 0)}</td>
                                    <td>{formatTimestamp(f.createdAt)}</td>
                                    <td>
                                        <button
                                            className="action-btn"
                                            onClick={() => {
                                                setSelectedUserEmail(f.email);
                                                setSelectedFeatureOrLocation(isFeatureTab ? f.feature || "N/A" : f.location || "N/A");
                                                setIsModalOpen(true);
                                            }}
                                        >
                                            Send Message
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ textAlign: "center" }}>
                                    No feedback found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            );
        }

        return (
            <div className="drill-row">
                {entries.map((item, idx) => {
                    const arr = avgPerKey(item.entries);
                    const topAvg = arr[0]?.avg ?? null;

                    return (
                        <div key={idx} className="drill-group" style={{ minWidth: 220 }}>
                            <div
                                className="period-card"
                                onClick={() => {
                                    const nextIdx = DRILL_LEVELS.indexOf(drillState.level) + 1;
                                    const nextLevel = DRILL_LEVELS[nextIdx];
                                    const obj = {};
                                    switch (nextLevel) {
                                        case "quarterly":
                                            obj.quarterObj = item;
                                            break;
                                        case "monthly":
                                            obj.monthObj = item;
                                            break;
                                        case "weekly":
                                            obj.weekObj = item;
                                            break;
                                        case "daily":
                                            obj.weekObj = item;
                                            break;
                                        case "table":
                                            obj.dayObj = item;
                                            break;
                                    }
                                    drillTo(nextLevel, obj);
                                }}
                            >
                                <h4>{item.label}</h4>
                                {item.entries && <p>{item.entries.length} feedbacks</p>}
                                {topAvg && <p>Top Avg: {topAvg.toFixed(1)}</p>}
                            </div>
                            {item.entries && item.entries.length > 0 && (
                                <div style={{ marginTop: 6 }}>
                                    <small>Top: {arr[0]?.key ?? "—"}</small>
                                    <br />
                                    <small>Low: {arr[arr.length - 1]?.key ?? "—"}</small>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="dashboard-main">
                <h2>Feedback Review</h2>

                <div className="tabs">
                    {["Location Feedback", "Feature Feedback", "All Feedback"].map((tab) => (
                        <button
                            key={tab}
                            className={activeTab === tab ? "active-tab" : ""}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="summary-cards">
                    <div>Average Rating: {averageRating}</div>
                    {isLocationTab && (
                        <>
                            <div>Most Loved Location: {mostLovedLocation}</div>
                            <div>Area of Concern: {areaOfConcern}</div>
                        </>
                    )}
                    {isFeatureTab && (
                        <>
                            <div>Most Loved Feature: {mostLovedFeature}</div>
                            <div>Area of Concern Feature: {areaOfConcernFeature}</div>
                        </>
                    )}
                </div>

                {drillState.level !== "yearly" && (
                    <button className="back-btn" onClick={backLevel}>
                        &larr; Back
                    </button>
                )}

                <DrillView />

                {/* Modal for sending message */}
                {isModalOpen && (
                    <div className="modal">
                        <h3>Send Message to {selectedUserEmail}</h3>
                        <p>Context: {selectedFeatureOrLocation}</p>
                        <textarea
                            rows="5"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                        />
                        <button disabled={isSending} onClick={sendMessage}>
                            {isSending ? "Sending..." : "Send"}
                        </button>
                        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
                    </div>
                )}

                {/* Image preview modal */}
                {showImageModal && (
                    <div className="image-modal" onClick={() => setShowImageModal(false)}>
                        <img src={imagePreview} alt="Preview" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackReview;
