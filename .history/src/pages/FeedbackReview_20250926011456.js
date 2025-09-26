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

    const [overallTop, setOverallTop] = useState("N/A");
    const [overallLow, setOverallLow] = useState("N/A");
    const [overallLocationRating, setOverallLocationRating] = useState("N/A");
    const [overallFeatureRating, setOverallFeatureRating] = useState("N/A");


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

            const featureStats = avgPerKey(filtered);
            if (featureStats.length) {
                setMostLovedFeature(featureStats[0].key);
                setAreaOfConcernFeature(featureStats[featureStats.length - 1].key);
            } else {
                setMostLovedFeature("N/A");
                setAreaOfConcernFeature("N/A");
            }
        } else if (tabType === "Location Feedback") {
            filtered = data.filter((i) => i.feedbackType === "Location Feedback");

            const locationStats = avgPerKey(filtered);
            if (locationStats.length) {
                setMostLovedLocation(locationStats[0].key);
                setAreaOfConcern(locationStats[locationStats.length - 1].key);
            } else {
                setMostLovedLocation("N/A");
                setAreaOfConcern("N/A");
            }
        } else {
            filtered = data;

            // reset when viewing "All"
            setMostLovedFeature("N/A");
            setAreaOfConcernFeature("N/A");
            setMostLovedLocation("N/A");
            setAreaOfConcern("N/A");
        }

        const averageForEntries = (entries) => {
            const valid = entries.filter(e => e.rating != null);
            if (!valid.length) return null;
            const sum = valid.reduce((acc, cur) => acc + (cur.rating || 0), 0);
            return sum / valid.length;
        };


        const avg = filtered.reduce((acc, cur) => acc + (cur.rating || 0), 0) / filtered.length;
        setAverageRating(isNaN(avg) ? "N/A" : avg.toFixed(1));

        // 🔹 Calculate overall averages per type
        const locationRatings = data.filter(i => i.feedbackType === "Location Feedback").map(i => i.rating || 0);
        const featureRatings = data.filter(i => i.feedbackType === "App Feedback").map(i => i.rating || 0);

        const locAvg = locationRatings.length
            ? (locationRatings.reduce((a, b) => a + b, 0) / locationRatings.length).toFixed(1)
            : "N/A";
        const featAvg = featureRatings.length
            ? (featureRatings.reduce((a, b) => a + b, 0) / featureRatings.length).toFixed(1)
            : "N/A";

        setOverallLocationRating(locAvg);
        setOverallFeatureRating(featAvg);

        // 🔹 Top/low calculation (already in your code)
        const globalRatings = {};
        data.forEach((item) => {
            const key = item.feature || item.location;
            if (key) {
                if (!globalRatings[key]) globalRatings[key] = [];
                globalRatings[key].push(item.rating || 0);
            }
        });

        const globalAverages = Object.entries(globalRatings).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }));

        if (globalAverages.length) {
            globalAverages.sort((a, b) => b.avg - a.avg);
            setOverallTop(globalAverages[0].key);
            setOverallLow(globalAverages[globalAverages.length - 1].key);
        } else {
            setOverallTop("N/A");
            setOverallLow("N/A");
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
    const averageForEntries = (entries) => {
        if (!entries.length) return null;
        const sum = entries.reduce((acc, cur) => acc + (cur.rating || 0), 0);
        return sum / entries.length;
    };

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

            // filter based on active tab
            if (!isAllTab) {
                if (isFeatureTab && f.feedbackType !== "App Feedback") return false;
                if (isLocationTab && f.feedbackType !== "Location Feedback") return false;
            }
            return true;
        });


    const avgPerKey = (items) => {
        const map = {};
        items.forEach((it) => {
            let key;
            if (isFeatureTab) key = it.feature || "N/A";
            else if (isLocationTab) key = it.location || "N/A";
            else key = it.feature || it.location || "N/A";

            if (!map[key]) map[key] = [];
            if (it.rating) map[key].push(it.rating); // only add valid ratings
        });

        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
            count: ratings.length,
        }));

        arr.sort((a, b) => b.avg - a.avg); // descending
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
        return weeks;
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
        const arr = avgPerKey(entries).filter(e => e.count > 0); // filter out entries with 0 ratings
        if (!arr.length) return { top: "—", low: "—" };
        return { top: arr[0]?.key ?? "—", low: arr[arr.length - 1]?.key ?? "—" };
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
            <p>Avg: {typeof avg === "number" ? avg.toFixed(2) : "—"}</p>
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

                <div className="cards-container">
                    {isLocationTab && (
                        <>
                            <div className="card brown">
                                <p>Average Location Rating</p>
                                <h2>{overallLocationRating}</h2>
                            </div>
                            <div className="card brown">
                                <p>Most Loved Location</p>
                                <h2>{mostLovedLocation || "N/A"}</h2>
                            </div>
                            <div className="card brown">
                                <p>Area of Concern (Location)</p>
                                <h2>{areaOfConcern || "N/A"}</h2>
                            </div>

                        </>
                    )}

                    {isFeatureTab && (
                        <>
                            <div className="card brown">
                                <p>Average Feature Rating</p>
                                <h2>{overallFeatureRating}</h2>
                            </div>
                            <div className="card brown">
                                <p>Most Loved Feature</p>
                                <h2>{mostLovedFeature || "N/A"}</h2>
                            </div>
                            <div className="card brown">
                                <p>Area of Concern (Feature)</p>
                                <h2>{areaOfConcernFeature || "N/A"}</h2>
                            </div>

                        </>
                    )}

                    {isAllTab && (
                        <>
                            <div className="card brown">
                                <p>Overall Average Rating</p>
                                <h2>{averageRating}</h2>
                            </div>
                            <div className="card brown">
                                <p>Overall Most Loved</p>
                                <h2>{overallTop || "N/A"}</h2>
                            </div>
                            <div className="card brown">
                                <p>Overall Area of Concern</p>
                                <h2>{overallLow || "N/A"}</h2>
                            </div>

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
                            ) : displayedFeedback.length > 0 ? (
                                displayedFeedback.map((entry, index) => (
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
                                                        isFeatureTab
                                                            ? entry.feature || "N/A"
                                                            : entry.location || "N/A"
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
                                    <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                                        No feedback found.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>
                    {/* Show More / Show Less controls */}
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        {!isExpanded && filteredFeedback.length > displayCount && (
                            <button className="show-more-btn" onClick={handleShowMore}>
                                Show More
                            </button>
                        )}
                        {isExpanded && (
                            <button className="show-less-btn" onClick={handleShowLess}>
                                Show Less
                            </button>
                        )}
                    </div>

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
                                            const { top, low } = topAndBottomForEntries(entries, activeTab);
                                            const avgValue = averageForEntries(entries);


                                            return (
                                                <div key={y} className="drill-group">
                                                    <PeriodCard
                                                        title={`${y}`}
                                                        avg={avgValue}
                                                        count={entries.length}
                                                        onClick={() => goToQuarterly(y)}
                                                    />

                                                    <small className="top">Top: {top}</small><br />
                                                    <small className="low">Low: {low}</small>

                                                </div>
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
                                        const entries = qObj.entries;
                                        const { top, low } = topAndBottomForEntries(entries, activeTab);
                                        const avgValue = averageForEntries(entries);

                                        return (
                                            <div key={qObj.label} className="drill-group">
                                                <PeriodCard
                                                    title={qObj.label}
                                                    avg={avgValue ? avgValue.toFixed(2) : "—"}
                                                    count={entries.length}
                                                    onClick={() => goToMonthly(qObj)}
                                                />
                                                <small className="top">Top: {top}</small><br />
                                                <small className="low">Low: {low}</small>
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
                                        const entries = qObj.entries;
                                        const { top, low } = topAndBottomForEntries(entries, activeTab);
                                        const avgValue = averageForEntries(entries);

                                        return (
                                            <div key={qObj.label} className="drill-group">
                                                <PeriodCard
                                                    title={qObj.label}
                                                    avg={avgValue ? avgValue.toFixed(2) : "—"}
                                                    count={entries.length}
                                                    onClick={() => goToMonthly(qObj)}
                                                />
                                                <small className="top">Top: {top}</small><br />
                                                <small className="low">Low: {low}</small>
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
                                    {weeksForMonth(selectedMonth.year, selectedMonth.monthIndex).map((w) => {
                                        const entries = w.entries; // all entries in this week
                                        const avgValue = averageForEntries(entries);
                                        const { top, low } = topAndBottomForEntries(entries);

                                        return (
                                            <PeriodCard
                                                title={w.label}
                                                avg={avgValue ? avgValue.toFixed(2) : "—"}
                                                count={entries.length}
                                                onClick={() => goToDays(w)}
                                            />
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
                                    {daysForWeekRange(selectedWeekRange.start, selectedWeekRange.end).map((dayObj) => {
                                        const entries = dayObj.entries; // all entries for this day
                                        const avgValue = averageForEntries(entries);
                                        const { top, low } = topAndBottomForEntries(entries);

                                        return (
                                            <PeriodCard
                                                title={dayObj.label}
                                                avg={avgValue ? avgValue.toFixed(2) : "—"}
                                                count={entries.length}
                                                onClick={() => goToTableForDay(dayObj)}
                                            />
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
                                            {activeTab === "All Feedback" && <th>App Feature</th>}
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
                                                    {activeTab === "All Feedback" && <td>{f.feedbackType === "App Feedback" ? f.feature || "N/A" : "—"}</td>}
                                                    <td>{isFeatureTab ? f.feature || "—" : f.location || "—"}</td>
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
                                                                setSelectedFeatureOrLocation(
                                                                    isFeatureTab ? f.feature || "N/A" : f.location || "N/A"
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
                                                <td colSpan={activeTab === "All Feedback" ? 9 : 8} style={{ textAlign: "center", padding: 20 }}>
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
