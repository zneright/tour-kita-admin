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
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfQuarter,
    endOfQuarter,
    startOfYear,
    endOfYear,
    format,
    isWithinInterval,
    parseISO,
} from "date-fns";

function FeedbackReview() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("location");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [viewLevel, setViewLevel] = useState("yearly");
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeekRange, setSelectedWeekRange] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            try {
                const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFeedbacks(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching feedback:", error);
                setLoading(false);
            }
        };

        fetchFeedbacks();
    }, []);

    const handleReplySubmit = async () => {
        if (!replyText.trim()) return;

        try {
            await addDoc(collection(db, "adminReplies"), {
                feedbackId: replyingTo,
                reply: replyText,
                createdAt: serverTimestamp(),
            });
            setReplyText("");
            setReplyingTo(null);
            setReplyModalOpen(false);
            alert("Reply sent successfully!");
        } catch (error) {
            console.error("Error sending reply:", error);
        }
    };

    const filteredFeedbacks = feedbacks.filter((fb) => {
        const term = searchTerm.toLowerCase();
        return (
            fb.email?.toLowerCase().includes(term) ||
            fb.location?.toLowerCase().includes(term) ||
            fb.feature?.toLowerCase().includes(term) ||
            fb.comment?.toLowerCase().includes(term) ||
            fb.rating?.toString().includes(term) ||
            (fb.createdAt?.toDate &&
                fb.createdAt.toDate().toLocaleDateString().includes(term))
        );
    });

    const stats = useMemo(() => {
        if (filteredFeedbacks.length === 0) return null;

        const avgRating =
            filteredFeedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0) /
            filteredFeedbacks.length;

        const counts = {};
        filteredFeedbacks.forEach((fb) => {
            const key = activeTab === "feature" ? fb.feature : fb.location;
            if (!key) return;
            counts[key] = counts[key] || { sum: 0, count: 0 };
            counts[key].sum += fb.rating || 0;
            counts[key].count += 1;
        });

        const avgPerKey = Object.entries(counts).map(([key, { sum, count }]) => ({
            key,
            avg: sum / count,
        }));

        avgPerKey.sort((a, b) => b.avg - a.avg);

        return {
            avgRating,
            mostLoved: avgPerKey[0],
            concern: avgPerKey[avgPerKey.length - 1],
            topAndBottom: avgPerKey,
        };
    }, [filteredFeedbacks, activeTab]);

    const avgOfEntries = (entries) => {
        if (!entries.length) return null;
        const total = entries.reduce((sum, e) => sum + (e.rating || 0), 0);
        return (total / entries.length).toFixed(2);
    };

    const goToQuarterly = (year) => {
        setSelectedYear(year);
        setViewLevel("quarterly");
    };
    const goToMonthly = (year, quarter) => {
        setSelectedQuarter({ year, quarter });
        setViewLevel("monthly");
    };
    const goToWeekly = (monthObj) => {
        setSelectedMonth(monthObj);
        setViewLevel("weekly");
    };
    const goToDaily = (weekObj) => {
        setSelectedWeekRange(weekObj);
        setViewLevel("daily");
    };
    const goToTableForDay = (dayObj) => {
        setSelectedDay(dayObj.date);
        setViewLevel("table");
    };

    const avgPerKey = (entries) => {
        const counts = {};
        entries.forEach((fb) => {
            const key = activeTab === "feature" ? fb.feature : fb.location;
            if (!key) return;
            counts[key] = counts[key] || { sum: 0, count: 0 };
            counts[key].sum += fb.rating || 0;
            counts[key].count += 1;
        });
        return Object.entries(counts).map(([key, { sum, count }]) => ({
            key,
            avg: sum / count,
        }));
    };

    const topAndBottomForEntries = (entries) => {
        const arr = avgPerKey(entries);
        arr.sort((a, b) => b.avg - a.avg);
        return {
            top: arr[0] ? `${arr[0].key} (${arr[0].avg.toFixed(2)})` : "-",
            low:
                arr[arr.length - 1]
                    ? `${arr[arr.length - 1].key} (${arr[arr.length - 1].avg.toFixed(2)})`
                    : "-",
        };
    };

    const daysForWeekRange = (start, end) => {
        let day = start;
        const arr = [];
        while (day <= end) {
            const entries = filteredFeedbacks.filter((fb) => {
                const d = fb.createdAt?.toDate();
                return d && isWithinInterval(d, { start: day, end: day });
            });
            arr.push({ date: day, label: format(day, "MMM d"), entries });
            day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
        }
        return arr;
    };

    if (loading) return <p>Loading feedback...</p>;

    return (
        <div className="feedback-review">
            <Sidebar />
            <div className="feedback-review-content">
                <h2>Feedback Review</h2>

                <div className="tabs">
                    <button
                        className={activeTab === "location" ? "active" : ""}
                        onClick={() => setActiveTab("location")}
                    >
                        Location
                    </button>
                    <button
                        className={activeTab === "feature" ? "active" : ""}
                        onClick={() => setActiveTab("feature")}
                    >
                        App Feature
                    </button>
                    <button
                        className={activeTab === "all" ? "active" : ""}
                        onClick={() => setActiveTab("all")}
                    >
                        All Feedback
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="feedback-search"
                />

                {stats && (
                    <div className="statistics">
                        <h3>Statistics</h3>
                        <p>Average Rating: {stats.avgRating.toFixed(2)}</p>
                        <p>
                            Most Loved: {stats.mostLoved?.key} (
                            {stats.mostLoved?.avg.toFixed(2)})
                        </p>
                        <p>
                            Areas of Concern: {stats.concern?.key} (
                            {stats.concern?.avg.toFixed(2)})
                        </p>
                    </div>
                )}

                {/* YEARLY */}
                {viewLevel === "yearly" && (
                    <div className="drill-row">
                        {Array.from(
                            new Set(
                                filteredFeedbacks.map((fb) =>
                                    fb.createdAt?.toDate().getFullYear()
                                )
                            )
                        ).map((year) => {
                            const entries = filteredFeedbacks.filter(
                                (fb) => fb.createdAt?.toDate().getFullYear() === year
                            );
                            const { top, low } = topAndBottomForEntries(entries);
                            const avg = avgOfEntries(entries);
                            return (
                                <div key={year} className="drill-group">
                                    <PeriodCard
                                        title={year}
                                        avg={avg}
                                        count={entries.length}
                                        onClick={() => goToQuarterly(year)}
                                    />
                                    <small className="top">Top: {top}</small>
                                    <br />
                                    <small className="low">Low: {low}</small>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* QUARTERLY */}
                {viewLevel === "quarterly" && selectedYear && (
                    <>
                        <h3>Quarters of {selectedYear}</h3>
                        <div className="drill-row">
                            {[1, 2, 3, 4].map((qtr) => {
                                const qStart = startOfQuarter(
                                    new Date(selectedYear, (qtr - 1) * 3, 1)
                                );
                                const qEnd = endOfQuarter(qStart);
                                const entries = filteredFeedbacks.filter((fb) => {
                                    const d = fb.createdAt?.toDate();
                                    return d && isWithinInterval(d, { start: qStart, end: qEnd });
                                });
                                const { top, low } = topAndBottomForEntries(entries);
                                const avg = avgOfEntries(entries);
                                return (
                                    <div key={qtr} className="drill-group">
                                        <PeriodCard
                                            title={`Q${qtr}`}
                                            avg={avg}
                                            count={entries.length}
                                            onClick={() => goToMonthly(selectedYear, qtr)}
                                        />
                                        <small className="top">Top: {top}</small>
                                        <br />
                                        <small className="low">Low: {low}</small>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* MONTHLY */}
                {viewLevel === "monthly" && selectedQuarter && (
                    <>
                        <h3>
                            Months of {selectedQuarter.year}, Q{selectedQuarter.quarter}
                        </h3>
                        <div className="drill-row">
                            {Array.from({ length: 3 }, (_, i) => {
                                const monthIdx = (selectedQuarter.quarter - 1) * 3 + i;
                                const mStart = startOfMonth(
                                    new Date(selectedQuarter.year, monthIdx, 1)
                                );
                                const mEnd = endOfMonth(mStart);
                                const entries = filteredFeedbacks.filter((fb) => {
                                    const d = fb.createdAt?.toDate();
                                    return d && isWithinInterval(d, { start: mStart, end: mEnd });
                                });
                                const { top, low } = topAndBottomForEntries(entries);
                                const avg = avgOfEntries(entries);
                                return (
                                    <div key={monthIdx} className="drill-group">
                                        <PeriodCard
                                            title={format(mStart, "MMMM")}
                                            avg={avg}
                                            count={entries.length}
                                            onClick={() =>
                                                goToWeekly({
                                                    year: selectedQuarter.year,
                                                    monthIdx,
                                                    entries,
                                                    label: format(mStart, "MMMM"),
                                                })
                                            }
                                        />
                                        <small className="top">Top: {top}</small>
                                        <br />
                                        <small className="low">Low: {low}</small>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* WEEKLY */}
                {viewLevel === "weekly" && selectedMonth && (
                    <>
                        <h3>Weeks of {selectedMonth.label}</h3>
                        <div className="drill-row">
                            {(() => {
                                const weeks = [];
                                let start = startOfMonth(
                                    new Date(selectedMonth.year, selectedMonth.monthIdx, 1)
                                );
                                const end = endOfMonth(start);
                                while (start <= end) {
                                    const wStart = startOfWeek(start, { weekStartsOn: 1 });
                                    const wEnd = endOfWeek(start, { weekStartsOn: 1 });
                                    const entries = filteredFeedbacks.filter((fb) => {
                                        const d = fb.createdAt?.toDate();
                                        return d && isWithinInterval(d, { start: wStart, end: wEnd });
                                    });
                                    weeks.push({ start: wStart, end: wEnd, entries });
                                    start = new Date(wEnd.getTime() + 24 * 60 * 60 * 1000);
                                }
                                return weeks.map((w, idx) => {
                                    const { top, low } = topAndBottomForEntries(w.entries);
                                    const avg = avgOfEntries(w.entries);
                                    return (
                                        <div key={idx} className="drill-group">
                                            <PeriodCard
                                                title={`${format(w.start, "MMM d")} - ${format(
                                                    w.end,
                                                    "MMM d"
                                                )}`}
                                                avg={avg}
                                                count={w.entries.length}
                                                onClick={() => goToDaily(w)}
                                            />
                                            <small className="top">Top: {top}</small>
                                            <br />
                                            <small className="low">Low: {low}</small>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </>
                )}

                {/* DAILY */}
                {viewLevel === "daily" && selectedWeekRange && (
                    <>
                        <h3>
                            Days — {format(selectedWeekRange.start, "MMM d")} to{" "}
                            {format(selectedWeekRange.end, "MMM d, yyyy")}
                        </h3>
                        <div className="drill-row">
                            {daysForWeekRange(
                                selectedWeekRange.start,
                                selectedWeekRange.end
                            ).map((dayObj, idx) => {
                                const { top, low } = topAndBottomForEntries(dayObj.entries);
                                const avg = avgOfEntries(dayObj.entries);
                                return (
                                    <div key={idx} className="drill-group">
                                        <PeriodCard
                                            title={dayObj.label}
                                            avg={avg}
                                            count={dayObj.entries.length}
                                            onClick={() => goToTableForDay(dayObj)}
                                        />
                                        <small className="top">Top: {top}</small>
                                        <br />
                                        <small className="low">Low: {low}</small>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PeriodCard({ title, avg, count, onClick }) {
    return (
        <div className="period-card" onClick={onClick}>
            <h4>{title}</h4>
            <p>Average Rating: {avg ?? "-"}</p>
            <p>Entries: {count}</p>
        </div>
    );
}

export default FeedbackReview;
