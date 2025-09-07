import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import "./EventsScreen.css";

const localizer = momentLocalizer(moment);

// Convert Firestore Timestamp or string to Date
const parseDate = (val) => {
    if (!val) return null;
    if (val.toDate) return val.toDate(); // Firestore Timestamp
    return new Date(val); // string like "2025-09-21"
};

// Format Date → "YYYY-MM-DD"
const formatLocalDate = (date) => {
    if (!date) return "";
    return moment(date).format("YYYY-MM-DD");
};

const EventCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
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
                    title: data.title,
                    time: data.eventStartTime || "",
                    endTime: data.eventEndTime || "",
                    address: data.customAddress || "Unknown Location",
                    imageUrl: data.imageUrl || "",
                    recurrence,
                };

                // Handle one-time event
                if (recurrence.frequency === "once") {
                    const start = parseDate(data.startDate);
                    if (start) {
                        fetchedEvents.push({
                            ...baseEvent,
                            date: formatLocalDate(start),
                        });
                    }
                }

                // Handle weekly recurring event
                if (
                    recurrence.frequency === "weekly" &&
                    data.startDate &&
                    recurrence.endDate
                ) {
                    let start = parseDate(data.startDate);
                    let end = parseDate(recurrence.endDate);

                    if (!start || !end) return;

                    // Ensure end >= start
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

            console.log("✅ Normalized events:", fetchedEvents);
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("❌ Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Filter events for the selected date
    const handleSelectSlot = (slotInfo) => {
        const selected = formatLocalDate(slotInfo.start);
        setSelectedDate(selected);
        const filtered = events.filter((event) => event.date === selected);
        setFilteredEvents(filtered);
    };

    // Highlight days with events
    const eventDates = new Set(events.map((e) => e.date));

    const EventWrapper = ({ value }) => {
        const dateStr = formatLocalDate(value);
        const hasEvent = eventDates.has(dateStr);
        return (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    backgroundColor: hasEvent ? "#ffcccc" : "transparent",
                }}
            >
                {value.getDate()}
            </div>
        );
    };

    return (
        <div className="events-container">
            <h2>📅 Events Calendar</h2>

            {loading ? (
                <p>Loading events...</p>
            ) : (
                <>
                    <Calendar
                        localizer={localizer}
                        events={[]} // We highlight manually
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 500 }}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        components={{
                            dateCellWrapper: EventWrapper,
                        }}
                    />

                    {/* Show selected date events */}
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
                </>
            )}
        </div>
    );
};

export default EventCalendar;
