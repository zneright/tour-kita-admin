import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./EventCalendar.css";
import EventsModal from "./EventsModal";

const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const formatLocalDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

function formatTime12Hour(time24) {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minute} ${ampm}`;
}

const getDateKey = (date) => (date ? formatLocalDate(date) : null);

const EventCalendar = ({ onDateSelect }) => {
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const totalDays = endOfMonth.getDate();

    const goToPreviousMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear((prev) => prev - 1);
        } else {
            setMonth((prev) => prev - 1);
        }
    };

    const goToNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear((prev) => prev + 1);
        } else {
            setMonth((prev) => prev + 1);
        }
    };

    const isToday = (date) =>
        date &&
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const eventSnap = await getDocs(collection(db, "events"));
            const markerSnap = await getDocs(collection(db, "markers"));

            const markerMap = {};
            markerSnap.forEach((doc) => {
                markerMap[doc.id] = doc.data().name || "Unknown";
            });

            const fetchedEvents = [];

            eventSnap.forEach((doc) => {
                const data = doc.data();
                const eventDays = data.recurrence?.daysOfWeek || [];
                const startDate = new Date(data.startDate);
                const endDate = new Date(data.endDate);

                if (!eventDays.length) {
                    fetchedEvents.push({
                        id: doc.id,
                        title: data.title,
                        date: formatLocalDate(startDate),
                        description: data.description || "",
                        createdAt: data.createdAt || null,
                        updatedAt: data.updatedAt || null,
                        eventStartTime: data.eventStartTime,
                        eventEndTime: data.eventEndTime,
                        address: data.customAddress || markerMap[data.locationId] || "Unknown Location",
                        imageUrl: data.imageUrl || "",
                        openToPublic: data.openToPublic || false,
                        recurrence: data.recurrence || null,
                    });
                } else {
                    let currDate = new Date(startDate);
                    while (currDate <= endDate) {
                        const dayName = daysOfWeek[currDate.getDay()];
                        if (eventDays.includes(dayName)) {
                            fetchedEvents.push({
                                id: doc.id,
                                title: data.title,
                                date: formatLocalDate(currDate),
                                description: data.description || "",
                                createdAt: data.createdAt || null,
                                updatedAt: data.updatedAt || null,
                                eventStartTime: data.eventStartTime,
                                eventEndTime: data.eventEndTime,
                                address: data.customAddress || markerMap[data.locationId] || "Unknown Location",
                                imageUrl: data.imageUrl || "",
                                openToPublic: data.openToPublic || false,
                                recurrence: data.recurrence || null,
                            });
                        }
                        currDate.setDate(currDate.getDate() + 1);
                    }
                }
            });

            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const calendarDates = [];
    for (let i = 0; i < startDayOfWeek; i++) calendarDates.push(null);
    for (let day = 1; day <= totalDays; day++) {
        calendarDates.push(new Date(year, month, day));
    }

    const eventsByDate = {};
    events.forEach((event) => {
        const key = event.date;
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(event);
    });

    return (
        <div className="calendar">
            <div className="calendar-navigation">
                <button onClick={goToPreviousMonth}>←</button>
                <h3>
                    {startOfMonth.toLocaleString("default", { month: "long" })} {year}
                </h3>
                <button onClick={goToNextMonth}>→</button>
            </div>

            <div className="calendar-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="calendar-header-cell">
                        {day}
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", fontSize: "1.2rem", color: "#555" }}>
                    Loading events...
                </div>
            ) : (
                <div className="calendar-grid">
                    {calendarDates.map((date, index) => {
                        const key = getDateKey(date);
                        const dayEvents = date ? eventsByDate[key] || [] : [];

                        // Sort events by start time (earliest first)
                        const sortedEvents = dayEvents.sort((a, b) => {
                            const [aHour, aMin] = a.eventStartTime.split(":").map(Number);
                            const [bHour, bMin] = b.eventStartTime.split(":").map(Number);
                            return aHour - bHour || aMin - bMin;
                        });

                        return (
                            <div
                                key={index}
                                className={`calendar-cell ${date ? "" : "empty-cell"}`}
                                onClick={() => {
                                    if (date && onDateSelect) onDateSelect(date);
                                }}
                            >
                                {date && (
                                    <div className={`calendar-date ${isToday(date) ? "today" : ""}`}>
                                        {date.getDate()}
                                    </div>
                                )}

                                {sortedEvents.map((event, i) => {
                                    const bgColor = i % 2 === 0 ? "#493628" : "rgba(241, 191, 155, 1)";
                                    const textColor = i % 2 === 0 ? "#fff" : "#000";

                                    return (
                                        <div
                                            key={i}
                                            className="calendar-event"
                                            style={{
                                                backgroundColor: bgColor,
                                                color: textColor,
                                                padding: "2px 4px",
                                                borderRadius: "4px",
                                                marginBottom: "2px",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(event);
                                            }}
                                        >
                                            <div className="event-title">{event.title}</div>
                                            <div className="event-time">
                                                {event.eventStartTime} - {event.eventEndTime}
                                            </div>
                                            <div className="event-location">{event.address}</div>
                                        </div>
                                    );
                                })}

                            </div>
                        );
                    })}
                </div>
            )}

            {selectedEvent && (
                <EventsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onUpdate={() => fetchEvents()}
                />
            )}
        </div>
    );
};

export default EventCalendar;
