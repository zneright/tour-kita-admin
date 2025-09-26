import React, { useState, useMemo } from "react";
import {
    startOfDay, endOfDay,
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter,
    startOfYear, endOfYear,
    eachDayOfInterval, eachWeekOfInterval,
    format, getYear
} from "date-fns";

const Drilldown = ({ feedbackList, activeTab }) => {
    const [viewLevel, setViewLevel] = useState("yearly");
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeekRange, setSelectedWeekRange] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const isFeatureTab = activeTab === "Feature Feedback";
    const isLocationTab = activeTab === "Location Feedback";

    const asDate = (tsOrDate) => {
        if (!tsOrDate) return null;
        if (tsOrDate.toDate) return tsOrDate.toDate();
        if (tsOrDate instanceof Date) return tsOrDate;
        return new Date(tsOrDate);
    };

    const averageForEntries = (entries) => {
        const valid = entries.filter(e => typeof e.rating === "number" && e.rating > 0);
        if (!valid.length) return null;
        const sum = valid.reduce((acc, cur) => acc + cur.rating, 0);
        return sum / valid.length;
    };

    const entriesFor = (start, end, tabType = activeTab, parentInterval = null) =>
        feedbackList.filter((f) => {
            const d = asDate(f.createdAt);
            if (!d) return false;
            if (parentInterval && (d < parentInterval.start || d > parentInterval.end)) return false;
            if (start && end && (d < start || d > end)) return false;

            if (tabType !== "All Feedback") {
                if (tabType === "Feature Feedback" && f.feedbackType !== "App Feedback") return false;
                if (tabType === "Location Feedback" && f.feedbackType !== "Location Feedback") return false;
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
            if (it.rating) map[key].push(it.rating);
        });

        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
            count: ratings.length,
        }));

        arr.sort((a, b) => b.avg - a.avg);
        return arr;
    };

    const topAndBottomForEntries = (entries) => {
        const arr = avgPerKey(entries).filter(e => e.count > 0);
        if (!arr.length) return { top: "N/A", low: "N/A" };
        return { top: arr[0].key, low: arr[arr.length - 1].key };
    };

    const years = useMemo(() => {
        const set = new Set();
        feedbackList.forEach((f) => {
            const d = asDate(f.createdAt);
            if (d) set.add(getYear(d));
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [feedbackList]);

    const renderContent = () => {
        if (viewLevel === "yearly") {
            return (
                <div>
                    <h3>Yearly Drilldown</h3>
                    {years.map((year) => {
                        const start = startOfYear(new Date(year, 0, 1));
                        const end = endOfYear(new Date(year, 0, 1));
                        const entries = entriesFor(start, end);
                        const avg = averageForEntries(entries);
                        const { top, low } = topAndBottomForEntries(entries);
                        return (
                            <div
                                key={year}
                                className="drill-item"
                                onClick={() => {
                                    setSelectedYear(year);
                                    setViewLevel("quarterly");
                                }}
                            >
                                <strong>{year}</strong> — Avg: {avg ? avg.toFixed(1) : "N/A"}, Top: {top}, Low: {low}
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (viewLevel === "quarterly" && selectedYear) {
            return (
                <div>
                    <h3>Quarterly Drilldown ({selectedYear})</h3>
                    {[1, 2, 3, 4].map((q) => {
                        const start = startOfQuarter(new Date(selectedYear, (q - 1) * 3, 1));
                        const end = endOfQuarter(start);
                        const entries = entriesFor(start, end);
                        const avg = averageForEntries(entries);
                        const { top, low } = topAndBottomForEntries(entries);
                        return (
                            <div
                                key={q}
                                className="drill-item"
                                onClick={() => {
                                    setSelectedQuarter(q);
                                    setViewLevel("monthly");
                                }}
                            >
                                <strong>Q{q}</strong> — Avg: {avg ? avg.toFixed(1) : "N/A"}, Top: {top}, Low: {low}
                            </div>
                        );
                    })}
                    <button onClick={() => setViewLevel("yearly")}>⬅ Back</button>
                </div>
            );
        }

        if (viewLevel === "monthly" && selectedYear && selectedQuarter) {
            const startMonth = (selectedQuarter - 1) * 3;
            return (
                <div>
                    <h3>Monthly Drilldown (Q{selectedQuarter} {selectedYear})</h3>
                    {[0, 1, 2].map((m) => {
                        const month = startMonth + m;
                        const start = startOfMonth(new Date(selectedYear, month, 1));
                        const end = endOfMonth(start);
                        const entries = entriesFor(start, end);
                        const avg = averageForEntries(entries);
                        const { top, low } = topAndBottomForEntries(entries);
                        return (
                            <div
                                key={month}
                                className="drill-item"
                                onClick={() => {
                                    setSelectedMonth(month);
                                    setViewLevel("weekly");
                                }}
                            >
                                <strong>{format(start, "MMMM yyyy")}</strong> — Avg: {avg ? avg.toFixed(1) : "N/A"}, Top: {top}, Low: {low}
                            </div>
                        );
                    })}
                    <button onClick={() => setViewLevel("quarterly")}>⬅ Back</button>
                </div>
            );
        }

        if (viewLevel === "weekly" && selectedYear !== null && selectedMonth !== null) {
            const start = startOfMonth(new Date(selectedYear, selectedMonth, 1));
            const end = endOfMonth(start);
            const weeks = eachWeekOfInterval({ start, end });
            return (
                <div>
                    <h3>Weekly Drilldown ({format(start, "MMMM yyyy")})</h3>
                    {weeks.map((wStart, idx) => {
                        const wEnd = endOfWeek(wStart);
                        const entries = entriesFor(wStart, wEnd);
                        const avg = averageForEntries(entries);
                        const { top, low } = topAndBottomForEntries(entries);
                        return (
                            <div
                                key={idx}
                                className="drill-item"
                                onClick={() => {
                                    setSelectedWeekRange({ start: wStart, end: wEnd });
                                    setViewLevel("daily");
                                }}
                            >
                                <strong>{format(wStart, "MMM d")} - {format(wEnd, "MMM d")}</strong> — Avg: {avg ? avg.toFixed(1) : "N/A"}, Top: {top}, Low: {low}
                            </div>
                        );
                    })}
                    <button onClick={() => setViewLevel("monthly")}>⬅ Back</button>
                </div>
            );
        }

        if (viewLevel === "daily" && selectedWeekRange) {
            const days = eachDayOfInterval(selectedWeekRange);
            return (
                <div>
                    <h3>Daily Drilldown ({format(selectedWeekRange.start, "MMM d")} - {format(selectedWeekRange.end, "MMM d, yyyy")})</h3>
                    {days.map((day) => {
                        const start = startOfDay(day);
                        const end = endOfDay(day);
                        const entries = entriesFor(start, end);
                        const avg = averageForEntries(entries);
                        const { top, low } = topAndBottomForEntries(entries);
                        return (
                            <div
                                key={day.toISOString()}
                                className="drill-item"
                                onClick={() => {
                                    setSelectedDay(day);
                                }}
                            >
                                <strong>{format(day, "MMM d, yyyy")}</strong> — Avg: {avg ? avg.toFixed(1) : "N/A"}, Top: {top}, Low: {low}
                            </div>
                        );
                    })}
                    <button onClick={() => setViewLevel("weekly")}>⬅ Back</button>
                </div>
            );
        }

        return <p>No data available</p>;
    };

    return (
        <div className="drilldown-container">
            <h2>Drilldown View</h2>
            {renderContent()}
        </div>
    );
};

export default Drilldown;
