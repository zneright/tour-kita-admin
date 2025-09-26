import React, { useMemo, useState } from "react";
import {
    startOfDay, endOfDay,
    startOfWeek, endOfWeek,
    startOfMonth, endOfMonth,
    startOfQuarter, endOfQuarter,
    startOfYear, endOfYear,
    eachDayOfInterval, eachWeekOfInterval,
    format, getYear
} from "date-fns";
import "./Drilldown.css";

const Drilldown = ({ feedbackList, activeTab }) => {
    const [viewLevel, setViewLevel] = useState("yearly");
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedQuarter, setSelectedQuarter] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedWeekRange, setSelectedWeekRange] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const isFeatureTab = activeTab === "Feature Feedback";
    const isLocationTab = activeTab === "Location Feedback";
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);


    const asDate = (val) => {
        if (!val) return null;
        if (val.toDate) return val.toDate();
        if (val instanceof Date) return val;
        return new Date(val);
    };

    const entriesFor = (start, end, parentInterval = null) =>
        feedbackList.filter((f) => {
            const d = asDate(f.createdAt);
            if (!d) return false;
            if (parentInterval && (d < parentInterval.start || d > parentInterval.end)) return false;
            if (start && end && (d < start || d > end)) return false;

            if (isFeatureTab && f.feedbackType !== "App Feedback") return false;
            if (isLocationTab && f.feedbackType !== "Location Feedback") return false;

            if (selectedFeature && f.feature !== selectedFeature) return false;
            if (selectedLocation && f.location !== selectedLocation) return false;

            return true;
        });


    const averageForEntries = (entries) => {
        const valid = entries.filter(e => typeof e.rating === "number" && e.rating > 0);
        if (!valid.length) return null;
        return valid.reduce((acc, cur) => acc + cur.rating, 0) / valid.length;
    };

    const topAndBottomForEntries = (entries) => {
        const map = {};
        entries.forEach((it) => {
            const key = isFeatureTab ? it.feature : isLocationTab ? it.location : it.feature || it.location;
            if (!key) return;
            if (!map[key]) map[key] = [];
            if (it.rating) map[key].push(it.rating);
        });

        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
        }));

        arr.sort((a, b) => b.avg - a.avg);
        return arr.length ? { top: arr[0].key, low: arr[arr.length - 1].key } : { top: "N/A", low: "N/A" };
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

    const PeriodCard = ({ title, avg, count, onClick, top, low }) => (
        <div className="drill-group">
            <div className="drill-card" onClick={onClick}>
                <h4>{title}</h4>
                <p>Avg: {typeof avg === "number" ? avg.toFixed(2) : "—"}</p>
                <p>{count ? `${count} feedback(s)` : "No data"}</p>
            </div>
            <small className="top">Top: {top}</small><br />
            <small className="low">Low: {low}</small>
        </div>
    );

    return (

        <div className="ratings-drilldown">
            {viewLevel === "yearly" && (
                <>
                    <h3>Years</h3>
                    <div className="drill-row">
                        {years.map((y) => {
                            const start = startOfYear(new Date(y, 0, 1));
                            const end = endOfYear(new Date(y, 0, 1));
                            const entries = entriesFor(start, end);
                            const avg = averageForEntries(entries);
                            const { top, low } = topAndBottomForEntries(entries);
                            return (
                                <PeriodCard
                                    key={y}
                                    title={`${y}`}
                                    avg={avg}
                                    count={entries.length}
                                    top={top}
                                    low={low}
                                    onClick={() => { setSelectedYear(y); setViewLevel("quarterly"); }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {viewLevel === "quarterly" && selectedYear && (
                <>
                    <button onClick={() => setViewLevel("yearly")}>Back</button>
                    <h3>Quarters of {selectedYear}</h3>
                    <div className="drill-row">
                        {[0, 1, 2, 3].map((q) => {
                            const start = startOfQuarter(new Date(selectedYear, q * 3, 1));
                            const end = endOfQuarter(new Date(selectedYear, q * 3, 1));
                            const entries = entriesFor(start, end);
                            const avg = averageForEntries(entries);
                            const { top, low } = topAndBottomForEntries(entries);
                            return (
                                <PeriodCard
                                    key={q}
                                    title={`Q${q + 1}`}
                                    avg={avg}
                                    count={entries.length}
                                    top={top}
                                    low={low}
                                    onClick={() => { setSelectedQuarter(q); setViewLevel("monthly"); }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {viewLevel === "monthly" && selectedYear !== null && selectedQuarter !== null && (
                <>
                    <button onClick={() => setViewLevel("quarterly")}>Back</button>
                    <h3>Months in Q{selectedQuarter + 1} {selectedYear}</h3>
                    <div className="drill-row">
                        {[0, 1, 2].map((m) => {
                            const monthIdx = selectedQuarter * 3 + m;
                            const start = startOfMonth(new Date(selectedYear, monthIdx, 1));
                            const end = endOfMonth(new Date(selectedYear, monthIdx, 1));
                            const entries = entriesFor(start, end);
                            const avg = averageForEntries(entries);
                            const { top, low } = topAndBottomForEntries(entries);
                            return (
                                <PeriodCard
                                    key={monthIdx}
                                    title={format(start, "MMMM")}
                                    avg={avg}
                                    count={entries.length}
                                    top={top}
                                    low={low}
                                    onClick={() => { setSelectedMonth(monthIdx); setViewLevel("weekly"); }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {viewLevel === "weekly" && selectedYear !== null && selectedMonth !== null && (
                <>
                    <button onClick={() => setViewLevel("monthly")}>Back</button>
                    <h3>Weeks in {format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy")}</h3>
                    <div className="drill-row">
                        {eachWeekOfInterval(
                            { start: startOfMonth(new Date(selectedYear, selectedMonth, 1)), end: endOfMonth(new Date(selectedYear, selectedMonth, 1)) },
                            { weekStartsOn: 1 }
                        ).map((weekStart, idx) => {
                            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                            const entries = entriesFor(weekStart, weekEnd);
                            const avg = averageForEntries(entries);
                            const { top, low } = topAndBottomForEntries(entries);
                            return (
                                <PeriodCard
                                    key={idx}
                                    title={`Week of ${format(weekStart, "MMM d")}`}
                                    avg={avg}
                                    count={entries.length}
                                    top={top}
                                    low={low}
                                    onClick={() => { setSelectedWeekRange({ start: weekStart, end: weekEnd }); setViewLevel("daily"); }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {viewLevel === "daily" && selectedWeekRange && (
                <>
                    <button onClick={() => setViewLevel("weekly")}>Back</button>
                    <h3>Days in week of {format(selectedWeekRange.start, "MMM d")}</h3>
                    <div className="drill-row">
                        {eachDayOfInterval({ start: selectedWeekRange.start, end: selectedWeekRange.end }).map((day) => {
                            const start = startOfDay(day);
                            const end = endOfDay(day);
                            const entries = entriesFor(start, end);
                            const avg = averageForEntries(entries);
                            const { top, low } = topAndBottomForEntries(entries);
                            return (
                                <PeriodCard
                                    key={day.toISOString()}
                                    title={format(day, "MMM d")}
                                    avg={avg}
                                    count={entries.length}
                                    top={top}
                                    low={low}
                                    onClick={() => { setSelectedDay(day); setViewLevel("table"); }}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {viewLevel === "table" && selectedDay && (
                <>
                    <button onClick={() => setViewLevel("daily")}>Back</button>
                    <h3>Feedback for {format(selectedDay, "PPP")}</h3>
                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Type</th>
                                <th>Feature/Location</th>
                                <th>Rating</th>
                                <th>Feedback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entriesFor(startOfDay(selectedDay), endOfDay(selectedDay)).map((f, i) => (
                                <tr key={i}>
                                    <td>{f.email}</td>
                                    <td>{f.feedbackType}</td>
                                    <td>{f.feature || f.location}</td>
                                    <td>{f.rating}</td>
                                    <td>{f.feedback}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default Drilldown;
