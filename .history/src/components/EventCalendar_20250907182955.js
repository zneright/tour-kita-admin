import React, { useEffect, useState } from "react";
import moment from "moment";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import EventsModal from "./EventsModal";
import "./EventCalendar.css";

const parseDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate();
    return new Date(val);
};

const formatLocalDate = (date) => {
    if (!date) return "";
    return moment(date).format("YYYY-MM-DD");
};

const EventCalendar = () => {
    const [events, setEvents] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [selectedDate, setSelectedDate] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const fetchEvents = async () => {
        try {
            const eventSnap = await getDocs(collection(db, "events"));
            const fetchedEvents = [];

            eventSnap.forEach((doc) => {
                const data = doc.data();
                const recurrence = data.recurrence || {
                    frequency: "once",
                    daysOfWeek: [],
                    endDate: "",
                };

                const baseEvent = {
                    id: doc.id,
                    title: data.title || "Untitled Event",
                    time: data.eventStartTime || "",
                    location: data.customAddress || data.locationId || "Unknown Location",
                    recurrence,
                };


                if (recurrence.frequency === "once") {
                    const start = parseDate(data.startDate);
                    if (start) {
                        fetchedEvents.push({ ...baseEvent, date: formatLocalDate(start) });
                    }
                }

                if (
                    recurrence.frequency === "weekly" &&
                    data.startDate &&
                    recurrence.endDate
                ) {
                    let start = parseDate(data.startDate);
                    let end = parseDate(recurrence.endDate);

                    if (!start || !end) return;

                    if (end < start) {
                        const tmp = start;
                        start = end;
                        end = tmp;
                    }

                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dayName = [
                            "sun",
                            "mon",
                            "tue",
                            "wed",
                            "thu",
                            "fri",
                            "sat",
                        ][d.getDay()];
                        if (recurrence.daysOfWeek.includes(dayName)) {
                            fetchedEvents.push({
                                ...baseEvent,
                                date: formatLocalDate(new Date(d)),
                            });
                        }
                    }
                }
            });

            setEvents(fetchedEvents);
        } catch (err) {
            console.error("❌ Error fetching events:", err);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const startOfMonth = currentMonth.clone().startOf("month");
    const endOfMonth = currentMonth.clone().endOf("month");
    const startDate = startOfMonth.clone().startOf("week");
    const endDate = endOfMonth.clone().endOf("week");

    const day = startDate.clone();
    const calendarDays = [];
    while (day.isBefore(endDate, "day")) {
        calendarDays.push(day.clone());
        day.add(1, "day");
    }

    const handlePrev = () =>
        setCurrentMonth(currentMonth.clone().subtract(1, "month"));
    const handleNext = () =>
        setCurrentMonth(currentMonth.clone().add(1, "month"));

    const handleSelectDate = (day) => {
        const dateStr = formatLocalDate(day.toDate());
        setSelectedDate(dateStr);
        setFilteredEvents(events.filter((e) => e.date === dateStr));
    };

    return (
        <div className="calendar">
            <div className="calendar-navigation">
                <button onClick={handlePrev}>◀</button>
                <h3>{currentMonth.format("MMMM YYYY")}</h3>
                <button onClick={handleNext}>▶</button>
            </div>

            <div className="calendar-header">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="calendar-header-cell">
                        {d}
                    </div>
                ))}
            </div>

            <div className="calendar-grid">
                {calendarDays.map((day, idx) => {
                    const dateStr = formatLocalDate(day.toDate());
                    const dayEvents = events.filter((e) => e.date === dateStr);
                    const isToday = day.isSame(moment(), "day");
                    const isCurrentMonth = day.isSame(currentMonth, "month");

                    return (
                        <div
                            key={idx}
                            className={`calendar-cell ${!isCurrentMonth ? "empty-cell" : ""}`}
                            onClick={() => isCurrentMonth && handleSelectDate(day)}
                        >
                            <div className={`calendar-date ${isToday ? "today" : ""}`}>
                                {day.date()}
                            </div>
                            {dayEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="calendar-event"
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent triggering date click
                                        setSelectedEvent(event); // ✅ FIX
                                    }}
                                >
                                    {event.title}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="event-details">
                    <h3>Events on {selectedDate}</h3>
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                            <div key={event.id} className="event-card">
                                <h4>{event.title}</h4>
                                <p>
                                    🕒 {event.time} - {event.endTime}
                                </p>
                                <p>📍 {event.address}</p>
                                {event.imageUrl && (
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="event-image"
                                    />
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No events on this date.</p>
                    )}
                </div>
            )}

            {selectedEvent && (
                <EventsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onUpdate={fetchEvents}
                />
            )}
        </div>
    );
};

export default EventCalendar;
