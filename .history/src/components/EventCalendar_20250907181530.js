{selectedEvent && (
  <EventModal
    event={selectedEvent}
    onClose={() => setSelectedEvent(null)}
    onUpdate={fetchEvents}
  />
)}
