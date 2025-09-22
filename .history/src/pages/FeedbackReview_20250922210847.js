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
import { startOfDay, endOfDay } from "date-fns";
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    subWeeks,
    subMonths,
    subQuarters,
    subYears,
    eachDayOfInterval,
    eachWeekOfInterval,
    format,
    getYear,
    getMonth,
    addDays,
    isWithinInterval,
} from "date-fns";


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

    const isFeatureTab = activeTab === "Feature Feedback";
    const isAllTab = activeTab === "All Feedback";
    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const isLocationTab = activeTab === "Location Feedback";
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const maxDisplay = 20;
    const [isExpanded, setIsExpanded] = useState(false);

    const [viewLevel, setViewLevel] = useState("yearly");
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeekRange, setSelectedWeekRange] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const [timeFilter, setTimeFilter] = useState("Weekly");

    const asDate = (tsOrDate) => {
        if (!tsOrDate) return null;
        if (tsOrDate.toDate) return tsOrDate.toDate();
        if (tsOrDate instanceof Date) return tsOrDate;
        return new Date(tsOrDate);
    };

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
    useEffect(() => {
        setDisplayCount(5);
    }, [activeTab, searchTerm]);
    const handleShowLess = () => {
        setDisplayCount(5);
        setIsExpanded(false);
    };

    const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);
    const formatTimestamp = (timestamp) => (timestamp?.toDate ? timestamp.toDate().toLocaleString() : "N/A");

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
    const entriesFor = (start, end) =>
        feedbackList.filter((f) => {
            const d = asDate(f.createdAt);
            if (!d) return false;
            if (start && end && !isWithinInterval(d, { start, end })) return false;
            if (!isAllTab) {
                if (isFeatureTab && f.feedbackType !== "App Feedback") return false;
                if (isLocationTab && f.feedbackType !== "Location Feedback") return false;
            }
            return true;
        });

    const avgPerKey = (items) => {
        const map = {};
        items.forEach((it) => {
            const key = isFeatureTab ? it.feature || "N/A" : it.location || "N/A";
            if (!map[key]) map[key] = [];
            map[key].push(it.rating || 0);
        });
        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
        }));
        arr.sort((a, b) => b.avg - a.avg);
        return arr;
    };

    const years = useMemo(() => {
        const set = new Set();
        feedbackList.forEach((f) => {
            const d = asDate(f.createdAt);
            if (d) set.add(getYear(d));
        });
        set.add(getYear(new Date()));
        return Array.from(set).sort((a, b) => b - a);
    }, [feedbackList]);

    const quartersForYear = (year) => {
        const arr = [];
        for (let q = 1; q <= 4; q++) {
            const qStart = startOfQuarter(new Date(year, (q - 1) * 3, 1));
            const qEnd = endOfQuarter(new Date(year, (q - 1) * 3, 1));
            const entries = entriesFor(qStart, qEnd);
            arr.push({
                quarter: q,
                label: `Q${q} ${year}`,
                start: qStart,
                end: qEnd,
                entries,
            });
        }
        return arr;
    };

    const monthsForQuarter = (year, quarter) => {
        const months = [];
        const startMonth = (quarter - 1) * 3;
        for (let m = 0; m < 3; m++) {
            const monthIndex = startMonth + m;
            const mStart = startOfMonth(new Date(year, monthIndex, 1));
            const mEnd = endOfMonth(new Date(year, monthIndex, 1));
            const entries = entriesFor(mStart, mEnd);
            months.push({
                year,
                monthIndex,
                label: format(mStart, "LLLL yyyy"),
                start: mStart,
                end: mEnd,
                entries,
            });
        }
        return months;
    };

    const weeksForMonth = (year, monthIndex) => {
        const mStart = startOfMonth(new Date(year, monthIndex, 1));
        const mEnd = endOfMonth(new Date(year, monthIndex, 1));
        const weekStarts = eachWeekOfInterval({ start: mStart, end: mEnd }, { weekStartsOn: 1 });
        const weeks = weekStarts.map((ws) => {
            const we = endOfWeek(ws, { weekStartsOn: 1 });
            const start = ws < mStart ? mStart : ws;
            const end = we > mEnd ? mEnd : we;
            const entries = entriesFor(start, end);
            const label =
                start.getMonth() === end.getMonth()
                    ? `${format(start, "MMM d")}–${format(end, "d")}`
                    : `${format(start, "MMM d")}–${format(end, "MMM d")}`;
            return { start, end, label, entries };
        });
        return weeks; // <-- 🔥 this was missing
    };


    const daysForWeekRange = (start, end) => {
        const days = eachDayOfInterval({ start, end }).map((d) => {
            const dayStart = startOfDay(d);
            const dayEnd = endOfDay(d);
            return {
                date: d,
                label: format(d, "EEEE, MMM d"),
                entries: entriesFor(dayStart, dayEnd),
            };
        });
        return days;
    };

    const goToQuarterly = (year) => {
        setSelectedYear(year);
        setSelectedQuarter(null);
        setSelectedMonth(null);
        setSelectedWeekRange(null);
        setSelectedDay(null);
        setViewLevel("quarterly");
    };
    const goToMonthly = (quarterObj) => {
        setSelectedQuarter(quarterObj.quarter);
        setSelectedMonth(null);
        setSelectedWeekRange(null);
        setSelectedDay(null);
        setViewLevel("monthly");
    };
    const goToWeeks = (monthObj) => {
        setSelectedMonth({ year: monthObj.year, monthIndex: monthObj.monthIndex });
        setSelectedWeekRange(null);
        setSelectedDay(null);
        setViewLevel("weekly");
    };
    const goToDays = (weekObj) => {
        setSelectedWeekRange({ start: weekObj.start, end: weekObj.end });
        setSelectedDay(null);
        setViewLevel("daily");
    };
    const goToTableForDay = (dayObj) => {
        setSelectedDay(dayObj.date);
        setViewLevel("table");
    };

    const topAndBottomForEntries = (entries) => {
        const arr = avgPerKey(entries);
        if (!arr.length) return { top: [], bottom: [] };
        const top = arr.slice(0, 3);
        const bottom = arr.slice(-3).reverse();
        return { top, bottom };
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    const PeriodCard = ({ title, avg, count, onClick }) => (
        <div className="drill-card" onClick={onClick} role="button" tabIndex={0}>
            <h4>{title}</h4>
            <p>Avg: {avg ? avg.toFixed(2) : "—"}</p>
            <p>{count ? `${count} feedback(s)` : "No data"}</p>
        </div>
    );

    const feedbackForCurrentTable = () => {
        if (viewLevel === "table" && selectedDay) {
            return feedbackList.filter((f) => {
                const d = asDate(f.createdAt);
                return d && isSameDay(d, selectedDay);
            });
        }
        return [];
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="dashboard-main">
                <div className="dashboard-header">
                    <h2>Feedback Overview</h2>
                </div>

                {/* summary cards */}
                <div className="cards-container">
                    {loading ? (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="card brown">
                                    <div className="skeleton skeleton-icon"></div>
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-line short"></div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            <div className="card brown">
                                <p>Average Rating ({isFeatureTab ? "Feature" : "Location"})</p>
                                <h2 style={{ color: "green" }}>{averageRating}</h2>
                            </div>
                            {!isFeatureTab ? (
                                <>
                                    <div className="card brown">
                                        <p>Most Loved Location</p>
                                        <h2>{mostLovedLocation}</h2>
                                    </div>
                                    <div className="card brown">
                                        <p>Area of Concern</p>
                                        <h2>{areaOfConcern}</h2>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="card brown">
                                        <p>Most Loved Feature</p>
                                        <h2>{mostLovedFeature}</h2>
                                    </div>
                                    <div className="card brown">
                                        <p>Area of Concern (Feature)</p>
                                        <h2>{areaOfConcernFeature}</h2>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="mtab-buttons">
                    <button
                        className={`mtab ${activeTab === "Location Feedback" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("Location Feedback");
                            setSearchTerm("");
                        }}
                    >
                        Location Feedback
                    </button>
                    <button
                        className={`mtab ${activeTab === "Feature Feedback" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("Feature Feedback");
                            setSearchTerm("");
                        }}
                    >
                        Feature Feedback
                    </button>
                    <button
                        className={`mtab ${activeTab === "All Feedback" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("All Feedback");
                            setSearchTerm("");
                        }}
                    >
                        All Feedback
                    </button>
                </div>

                <div className="main-content">
                    <input
                        type="text"
                        className="search-bar"
                        placeholder="Search by email, feature/location,message or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Feedback table*/}
                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th></th>
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
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan="8">
                                            <div className="skeleton-card">
                                                <div className="skeleton skeleton-title"></div>
                                                <div className="skeleton skeleton-line medium"></div>
                                                <div className="skeleton skeleton-line"></div>
                                                <div className="skeleton skeleton-line short"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : displayedFeedback.length > 0 ? (
                                displayedFeedback.map((entry, index) => (
                                    <tr key={entry.id}>
                                        <td>{index + 1}</td>
                                        <td>{entry.email}</td>
                                        <td>{isFeatureTab ? entry.feature || "N/A" : entry.location || "N/A"}</td>
                                        <td>{entry.comment}</td>
                                        <td>
                                            {entry.imageUrl ? (
                                                <img
                                                    src={entry.imageUrl}
                                                    alt="Feedback"
                                                    className="feedback-image"
                                                    onClick={() => {
                                                        setImagePreview(entry.imageUrl);
                                                        setShowImageModal(true);
                                                    }}
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
                                                onClick={() => {
                                                    setSelectedUserEmail(entry.email);
                                                    setSelectedFeatureOrLocation(
                                                        isFeatureTab ? entry.feature || "N/A" : entry.location || "N/A"
                                                    );
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
                                    <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                                        No feedback found.
                                    </td>
                                </tr>
                            )}

                            {filteredFeedback.length > 5 && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "10px" }}>
                                        {!isExpanded && (
                                            <button className="show-more-btn" onClick={handleShowMore}>
                                                Show More
                                            </button>
                                        )}
                                        {isExpanded && (
                                            <button className="show-less-btn" onClick={handleShowLess}>
                                                Close
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Image modal */}
                    {showImageModal && (
                        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                            <div className="modal-content">
                                <img src={imagePreview} alt="Preview" className="preview-image" />
                            </div>
                        </div>
                    )}

                    {/* Send message modal */}
                    {isModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>
                                    Send Message to <span className="modal-email">{selectedUserEmail}</span>
                                </h3>
                                <p className="modal-sub">
                                    Regarding: <strong>{isFeatureTab ? "Feature" : "Location"} - {selectedFeatureOrLocation}</strong>
                                </p>
                                <textarea
                                    className="modal-textarea"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={5}
                                />
                                <div className="modal-actions">
                                    <button className="send-btn" onClick={sendMessage} disabled={isSending}>
                                        {isSending ? "Sending..." : "Send"}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isSending}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="ratings-drilldown" style={{ marginTop: 20 }}>
                        {viewLevel === "yearly" && (
                            <>
                                <h3>Years (click a year to open quarters)</h3>
                                <div className="drill-row">
                                    {years.length ? (
                                        years.map((y) => {
                                            const start = startOfYear(new Date(y, 0, 1));
                                            const end = endOfYear(new Date(y, 0, 1));
                                            const entries = entriesFor(start, end);
                                            const arr = avgPerKey(entries);
                                            const topAvg = arr[0]?.avg || null;
                                            return (
                                                <PeriodCard
                                                    key={y}
                                                    title={`${y}`}
                                                    avg={topAvg}
                                                    count={entries.length}
                                                    onClick={() => goToQuarterly(y)}
                                                />
                                            );
                                        })
                                    ) : (
                                        <p>No years / data</p>
                                    )}
                                </div>
                            </>
                        )}

                        {viewLevel === "quarterly" && selectedYear && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3>Quarters — {selectedYear}</h3>
                                    <div>
                                        <button onClick={() => setViewLevel("yearly")}>← Back to Years</button>
                                    </div>
                                </div>

                                <div className="drill-row">
                                    {quartersForYear(selectedYear).map((qObj) => {
                                        const { top, bottom } = topAndBottomForEntries(qObj.entries);
                                        const avgTop = top[0]?.avg ?? null;
                                        return (
                                            <div
                                                key={qObj.quarter}
                                                className="drill-group"
                                                style={{ minWidth: 220 }}
                                            >
                                                <PeriodCard
                                                    title={qObj.label}
                                                    avg={avgTop}
                                                    count={qObj.entries.length}
                                                    onClick={() => {
                                                        setSelectedQuarter(qObj.quarter);
                                                        setSelectedMonth(null);
                                                        setViewLevel("monthly");
                                                    }}
                                                />
                                                <div style={{ marginTop: 8 }}>
                                                    <small>Top: {top[0]?.key ?? "—"}</small>
                                                    <br />
                                                    <small>Low: {bottom[0]?.key ?? "—"}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* MONTHLY */}
                        {viewLevel === "monthly" && selectedYear && selectedQuarter && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3>
                                        Months — Q{selectedQuarter} {selectedYear}
                                    </h3>
                                    <div>
                                        <button
                                            onClick={() => {
                                                setViewLevel("quarterly");
                                                setSelectedMonth(null);
                                            }}
                                        >
                                            ← Back to Quarters
                                        </button>
                                    </div>
                                </div>

                                <div className="drill-row">
                                    {monthsForQuarter(selectedYear, selectedQuarter).map((mObj) => {
                                        const arr = avgPerKey(mObj.entries);
                                        const topAvg = arr[0]?.avg ?? null;
                                        return (
                                            <div key={mObj.monthIndex} className="drill-group" style={{ minWidth: 220 }}>
                                                <PeriodCard
                                                    title={mObj.label}
                                                    avg={topAvg}
                                                    count={mObj.entries.length}
                                                    onClick={() => {
                                                        goToWeeks(mObj);
                                                    }}
                                                />
                                                <div style={{ marginTop: 6 }}>
                                                    <small>Top: {arr[0]?.key ?? "—"}</small>
                                                    <br />
                                                    <small>Low: {arr[arr.length - 1]?.key ?? "—"}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* WEEKLY*/}
                        {viewLevel === "weekly" && selectedMonth && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3>
                                        Weeks — {format(new Date(selectedMonth.year, selectedMonth.monthIndex, 1), "LLLL yyyy")}
                                    </h3>
                                    <div>
                                        <button
                                            onClick={() => {
                                                setViewLevel("monthly");
                                                setSelectedWeekRange(null);
                                            }}
                                        >
                                            ← Back to Months
                                        </button>
                                    </div>
                                </div>

                                <div className="drill-row">
                                    {weeksForMonth(selectedMonth.year, selectedMonth.monthIndex).map((w, idx) => {
                                        const arr = avgPerKey(w.entries);
                                        const topAvg = arr[0]?.avg ?? null;
                                        return (
                                            <div key={idx} className="drill-group" style={{ minWidth: 220 }}>
                                                <PeriodCard
                                                    title={w.label}
                                                    avg={topAvg}
                                                    count={w.entries.length}
                                                    onClick={() => {
                                                        goToDays(w);
                                                    }}
                                                />
                                                <div style={{ marginTop: 6 }}>
                                                    <small>Top: {arr[0]?.key ?? "—"}</small>
                                                    <br />
                                                    <small>Low: {arr[arr.length - 1]?.key ?? "—"}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* DAILY */}
                        {viewLevel === "daily" && selectedWeekRange && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3>
                                        Days — {format(selectedWeekRange.start, "MMM d")} to {format(selectedWeekRange.end, "MMM d, yyyy")}
                                    </h3>
                                    <div>
                                        <button
                                            onClick={() => {
                                                setViewLevel("weekly");
                                                setSelectedDay(null);
                                            }}
                                        >
                                            ← Back to Weeks
                                        </button>
                                    </div>
                                </div>

                                <div className="drill-row">
                                    {daysForWeekRange(selectedWeekRange.start, selectedWeekRange.end).map((dObj) => {
                                        const arr = avgPerKey(dObj.entries);
                                        return (
                                            <div key={dObj.label} className="drill-group" style={{ minWidth: 220 }}>
                                                <PeriodCard
                                                    title={dObj.label}
                                                    avg={arr[0]?.avg ?? null}
                                                    count={dObj.entries.length}
                                                    onClick={() => goToTableForDay(dObj)}
                                                />
                                                <div style={{ marginTop: 6 }}>
                                                    <small>Top: {arr[0]?.key ?? "—"}</small>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* TABLE  */}
                        {viewLevel === "table" && selectedDay && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3>Feedback for {format(selectedDay, "EEEE, LLLL d, yyyy")}</h3>
                                    <div>
                                        <button
                                            onClick={() => {
                                                setViewLevel("daily");
                                                setSelectedDay(null);
                                            }}
                                        >
                                            ← Back to Days
                                        </button>
                                    </div>
                                </div>

                                <table className="feedback-table">
                                    <thead>
                                        <tr>
                                            <th></th>
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
                                        {feedbackForCurrentTable().length ? (
                                            feedbackForCurrentTable().map((f, i) => (
                                                <tr key={f.id || i}>
                                                    <td>{i + 1}</td>
                                                    <td>{f.email}</td>
                                                    <td>{isFeatureTab ? f.feature || "N/A" : f.location || "N/A"}</td>
                                                    <td>{f.comment}</td>
                                                    <td>
                                                        {f.imageUrl ? (
                                                            <img
                                                                src={f.imageUrl}
                                                                alt="Feedback"
                                                                className="feedback-image"
                                                                onClick={() => {
                                                                    setImagePreview(f.imageUrl);
                                                                    setShowImageModal(true);
                                                                }}
                                                            />
                                                        ) : (
                                                            "—"
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
                                                <td colSpan="8" style={{ textAlign: "center", padding: 20 }}>
                                                    No feedback for this day.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackReview;
