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
    eachDayOfInterval,
    eachWeekOfInterval,
    format,
    getYear,
    isWithinInterval,
} from "date-fns";

import FeedbackTable from "../components/FeedbackTable";

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
    // ⬆️ Put this with your other useMemos near the top
    const years = useMemo(() => {
        const set = new Set();
        feedbackList.forEach((f) => {
            const d = asDate(f.createdAt);
            if (d) set.add(getYear(d));
        });
        set.add(getYear(new Date()));
        return Array.from(set).sort((a, b) => b - a);
    }, [feedbackList]);

    const asDate = (tsOrDate) => {
        if (!tsOrDate) return null;
        if (tsOrDate.toDate) return tsOrDate.toDate();
        if (tsOrDate instanceof Date) return tsOrDate;
        return new Date(tsOrDate);
    };

    // ✅ Safe date formatter
    const safeFormat = (date, fmt) => {
        if (!(date instanceof Date) || isNaN(date)) return "";
        return format(date, fmt);
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

    // ✅ Average calculator
    const calcAverage = (items) => {
        const ratings = items
            .map((i) => i.rating)
            .filter((r) => typeof r === "number" && r > 0);
        if (!ratings.length) return null;
        return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    };

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
            setMostLovedFeature("N/A");
            setAreaOfConcernFeature("N/A");
            setMostLovedLocation("N/A");
            setAreaOfConcern("N/A");
        }

        // ✅ Fix average
        const avg = calcAverage(filtered);
        setAverageRating(avg !== null ? avg.toFixed(1) : "N/A");

        // ✅ Fix overall averages
        const locAvg = calcAverage(data.filter((i) => i.feedbackType === "Location Feedback"));
        const featAvg = calcAverage(data.filter((i) => i.feedbackType === "App Feedback"));

        setOverallLocationRating(locAvg !== null ? locAvg.toFixed(1) : "N/A");
        setOverallFeatureRating(featAvg !== null ? featAvg.toFixed(1) : "N/A");

        // ✅ Top/low
        const globalRatings = {};
        data.forEach((item) => {
            const key = item.feature || item.location;
            if (key && typeof item.rating === "number" && item.rating > 0) {
                if (!globalRatings[key]) globalRatings[key] = [];
                globalRatings[key].push(item.rating);
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

    const averageForEntries = (entries) => {
        const avg = calcAverage(entries);
        return avg !== null ? avg : null;
    };

    const avgPerKey = (entries) => {
        const map = {};
        entries.forEach((it) => {
            const key = isFeatureTab ? it.feature : it.location;
            if (!key) return;
            if (!map[key]) map[key] = [];
            if (typeof it.rating === "number" && it.rating > 0) map[key].push(it.rating);
        });
        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
        }));
        arr.sort((a, b) => b.avg - a.avg);
        return arr;
    };

    const entriesFor = (start, end, tabType = activeTab, parentInterval = null) =>
        feedbackList.filter((f) => {
            const d = asDate(f.createdAt);
            if (!d) return false;

            if (parentInterval && !isWithinInterval(d, parentInterval)) return false;
            if (start && end && !isWithinInterval(d, { start, end })) return false;

            if (tabType !== "All Feedback") {
                if (tabType === "Feature Feedback" && f.feedbackType !== "App Feedback") return false;
                if (tabType === "Location Feedback" && f.feedbackType !== "Location Feedback") return false;
            }

            return true;
        });

    const topAndBottomForEntries = (entries) => {
        const arr = avgPerKey(entries).filter((e) => e.count > 0);
        if (!arr.length) return { top: "N/A", low: "N/A" };
        return {
            top: arr[0].key,
            low: arr[arr.length - 1].key,
        };
    };

    const monthsForQuarter = (year, quarter, parentInterval) => {
        const months = [];
        const startMonth = (quarter - 1) * 3;
        for (let m = 0; m < 3; m++) {
            const monthIndex = startMonth + m;
            const mStart = startOfMonth(new Date(year, monthIndex, 1));
            const mEnd = endOfMonth(new Date(year, monthIndex, 1));
            const entries = entriesFor(mStart, mEnd, activeTab, parentInterval);
            months.push({
                year,
                monthIndex,
                label: safeFormat(mStart, "LLLL yyyy"),
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
                    ? `${safeFormat(start, "MMM d")}–${safeFormat(end, "d")}`
                    : `${safeFormat(start, "MMM d")}–${safeFormat(end, "MMM d")}`;
            return { start, end, label, entries };
        });
        return weeks;
    };

    const daysForWeekRange = (start, end) => {
        return eachDayOfInterval({ start, end }).map((d) => {
            const dayStart = startOfDay(d);
            const dayEnd = endOfDay(d);
            const entries = entriesFor(dayStart, dayEnd, activeTab);
            return {
                date: d,
                label: safeFormat(d, "EEEE, MMM d"),
                entries,
            };
        });
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
        setSelectedMonth({ year: monthObj.year, monthIndex: monthObj.monthIndex, start: monthObj.start, end: monthObj.end });
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

                    <FeedbackTable
                        loading={loading}
                        feedback={feedbackList.slice(0, displayCount)}
                        isAllTab={isAllTab}
                        isFeatureTab={isFeatureTab}
                        renderStars={(r) => "★".repeat(r) + "☆".repeat(5 - r)}
                        formatTimestamp={(ts) => (ts?.toDate ? ts.toDate().toLocaleString() : "N/A")}
                        onImageClick={(url) => {
                            setImagePreview(url);
                            setShowImageModal(true);
                        }}
                        onSendMessage={(email, context) => {
                            setSelectedUserEmail(email);
                            setSelectedFeatureOrLocation(context || "N/A");
                            setIsModalOpen(true);
                        }}
                    />

                    {/* Drilldowns */}
                    <div className="ratings-drilldown" style={{ marginTop: 20 }}>
                        {viewLevel === "yearly" && (
                            <>
                                <h3>Years</h3>
                                <div className="drill-row">
                                    {useMemo(() => {
                                        const set = new Set();
                                        feedbackList.forEach((f) => {
                                            const d = asDate(f.createdAt);
                                            if (d) set.add(getYear(d));
                                        });
                                        set.add(getYear(new Date()));
                                        return Array.from(set).sort((a, b) => b - a);
                                    }, [feedbackList]).map((y) => {
                                        const start = startOfYear(new Date(y, 0, 1));
                                        const end = endOfYear(new Date(y, 0, 1));
                                        const entries = entriesFor(start, end);
                                        const { top, low } = topAndBottomForEntries(entries);
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
                                    })}
                                </div>
                            </>
                        )}

                        {viewLevel === "quarterly" && selectedYear && (
                            <>
                                <h3>Quarters — {selectedYear}</h3>
                                <button onClick={() => setViewLevel("yearly")}>← Back</button>
                                <div className="drill-row">
                                    {[1, 2, 3, 4].map((q) => {
                                        const qStart = startOfQuarter(new Date(selectedYear, (q - 1) * 3, 1));
                                        const qEnd = endOfQuarter(new Date(selectedYear, (q - 1) * 3, 1));
                                        const entries = entriesFor(qStart, qEnd);
                                        const { top, low } = topAndBottomForEntries(entries);
                                        const avgValue = averageForEntries(entries);

                                        return (
                                            <div key={q} className="drill-group">
                                                <PeriodCard
                                                    title={`Q${q}`}
                                                    avg={avgValue}
                                                    count={entries.length}
                                                    onClick={() => goToMonthly({ quarter: q })}
                                                />
                                                <small>Top: {top}</small><br />
                                                <small>Low: {low}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {viewLevel === "monthly" && selectedYear && selectedQuarter && (
                            <>
                                <h3>Months — Q{selectedQuarter} {selectedYear}</h3>
                                <button onClick={() => setViewLevel("quarterly")}>← Back</button>
                                <div className="drill-row">
                                    {monthsForQuarter(selectedYear, selectedQuarter).map((mObj) => {
                                        const entries = entriesFor(mObj.start, mObj.end);
                                        const { top, low } = topAndBottomForEntries(entries);
                                        const avgValue = averageForEntries(entries);
                                        return (
                                            <div key={mObj.label} className="drill-group">
                                                <PeriodCard
                                                    title={mObj.label}
                                                    avg={avgValue}
                                                    count={entries.length}
                                                    onClick={() => goToWeeks(mObj)}
                                                />
                                                <small>Top: {top}</small><br />
                                                <small>Low: {low}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {viewLevel === "weekly" && selectedMonth && (
                            <>
                                <h3>Weeks — {safeFormat(selectedMonth.start, "MMMM yyyy")}</h3>
                                <button onClick={() => setViewLevel("monthly")}>← Back</button>
                                <div className="drill-row">
                                    {weeksForMonth(selectedMonth.year, selectedMonth.monthIndex).map((wObj, idx) => {
                                        const entries = entriesFor(wObj.start, wObj.end);
                                        const { top, low } = topAndBottomForEntries(entries);
                                        const avgValue = averageForEntries(entries);
                                        return (
                                            <div key={idx} className="drill-group">
                                                <PeriodCard
                                                    title={wObj.label}
                                                    avg={avgValue}
                                                    count={entries.length}
                                                    onClick={() => goToDays(wObj)}
                                                />
                                                <small>Top: {top}</small><br />
                                                <small>Low: {low}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {viewLevel === "daily" && selectedWeekRange && (
                            <>
                                <h3>Days</h3>
                                <button onClick={() => setViewLevel("weekly")}>← Back</button>
                                <div className="drill-row">
                                    {daysForWeekRange(selectedWeekRange.start, selectedWeekRange.end).map((dObj, idx) => {
                                        const entries = dObj.entries;
                                        const { top, low } = topAndBottomForEntries(entries);
                                        const avgValue = averageForEntries(entries);
                                        return (
                                            <div key={idx} className="drill-group">
                                                <PeriodCard
                                                    title={dObj.label}
                                                    avg={avgValue}
                                                    count={entries.length}
                                                    onClick={() => goToTableForDay(dObj)}
                                                />
                                                <small>Top: {top}</small><br />
                                                <small>Low: {low}</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {viewLevel === "table" && selectedDay && (
                            <>
                                <h3>Feedback for {safeFormat(selectedDay, "EEEE, LLLL d, yyyy")}</h3>
                                <button onClick={() => setViewLevel("daily")}>← Back</button>
                                <table className="feedback-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>{isFeatureTab ? "Feature" : "Location"}</th>
                                            <th>Feedback</th>
                                            <th>Rating</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {feedbackForCurrentTable().map((f, i) => (
                                            <tr key={i}>
                                                <td>{f.email}</td>
                                                <td>{isFeatureTab ? f.feature : f.location}</td>
                                                <td>{f.comment}</td>
                                                <td>{f.rating}</td>
                                                <td>{safeFormat(asDate(f.createdAt), "PPPpp")}</td>
                                            </tr>
                                        ))}
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
