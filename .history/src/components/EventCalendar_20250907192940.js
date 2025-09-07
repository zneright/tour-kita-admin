import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./EventCalendar.css";
import EventsModal from "./EventsModal";


const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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




const getDateKey = (date) => date ? formatLocalDate(date) : null;
const EventCalendar = ({ onDateSelect }) => {

    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

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

    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = startOfMonth.getDay();
    const totalDays = endOfMonth.getDate();
    const [loading, setLoading] = useState(true);

    const isToday = (date) =>
        date &&
        date.getDate() === new Date().getDate() &&
        date.getMonth() === new Date().getMonth() &&
        date.getFullYear() === new Date().getFullYear();

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

    const fetchEvents = async () => {
        setLoading(true);
        const eventSnap = await getDocs(collection(db, "events"));
        const markerSnap = await getDocs(collection(db, "markers"));

        const markerMap = {};
        markerSnap.forEach((doc) => {
            markerMap[doc.id] = doc.data().name || "Unknown";
        });

        const fetchedEvents = [];
        eventSnap.forEach((doc) => {
            const eventDays = data.recurrence?.daysOfWeek || []; // ["sun", "mon", ...]
const startDate = new Date(data.startDate);
const endDate = new Date(data.endDate);

if (!eventDays.length) {
    // Non-recurring
    fetchedEvents.push({
        id: doc.id,
        title: data.title,
        date: formatLocalDate(startDate),
        eventStartTime: data.eventStartTime,
        eventEndTime: data.eventEndTime,
        address: data.customAddress || (markerMap[data.locationId] || "Unknown Location"),
        imageUrl: data.imageUrl || "",
    });
} else {
    // Recurring: generate all occurrences within start-end
    let currDate = new Date(startDate);
    while (currDate <= endDate) {
        const dayName = daysOfWeek[currDate.getDay()].toLowerCase(); // sun, mon, ...
        if (eventDays.includes(dayName)) {
            fetchedEvents.push({
                id: doc.id,
                title: data.title,
                date: formatLocalDate(currDate),
                eventStartTime: data.eventStartTime,
                eventEndTime: data.eventEndTime,
                address: data.customAddress || (markerMap[data.locationId] || "Unknown Location"),
                imageUrl: data.imageUrl || "",
            });
        }
        currDate.setDate(currDate.getDate() + 1);
    }
}

            const data = doc.data();
            fetchedEvents.push({
                id: doc.id,
                ...data,
                title: data.title,
                eventStartTime: data.eventStartTime,
                eventEndTime: data.eventEndTime,
                address: data.customAddress || (markerMap[data.locationId] || "Unknown Location"),
                imageUrl: data.imageUrl || "",

            });
        });


        setEvents(fetchedEvents);
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    return (
        <div className="calendar">

            <div className="calendar-navigation">

                <button onClick={goToPreviousMonth}>←</button>
                <h3>{startOfMonth.toLocaleString('default', { month: 'long' })} {year}</h3>
                <button onClick={goToNextMonth}>→</button>
            </div>

            <div className="calendar-header">
                {daysOfWeek.map((day) => (
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

                                {dayEvents.map((event, i) => (
                                    <div
                                        key={i}
                                        className="calendar-event"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedEvent(event);
                                        }}
                                    >
                                        <div className="event-title">{event.title}</div>
                                        <div className="event-time">{event.eventStartTime}</div>
                                        <div className="event-location">{event.address}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}


            {selectedEvent && (
                <EventsModal
                    event={selectedEvent}
                    onClose={() => {
                        fetchEvents();
                        setSelectedEvent(null);
                    }}
                />
            )}
        </div>
    );
};

export default EventCalendar;
