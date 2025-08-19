import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './MarkersManagement.css';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MarkerFormModal from '../components/MarkerFormModal';
import EventFormModal from "../components/EventFormModal";
import EventCalendar from "../components/EventCalendar";


const getEmptyForm = () => ({
    id: '',
    name: '',
    image: '',
    latitude: '',
    longitude: '',
    entranceFee: '',
    address: '',
    description: '',
    categoryOption: '',
    arCameraSupported: false,
    accessibleRestrooms: false,
    openingHours: {
        monday: { open: '', close: '', closed: false },
        tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false },
        thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false },
        saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false }
    }
});

const MarkersManagement = () => {
    const [markers, setMarkers] = useState([]);
    const [form, setForm] = useState(getEmptyForm());
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ message: '', status: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewMarker, setPreviewMarker] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventForm, setEventForm] = useState({
        title: '',
        description: '',
        date: '',
        time: ''
    });
    const [selectedTab, setSelectedTab] = useState("markers");
    const [events, setEvents] = useState([]); // Fetched from Firestore
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState(null);
    const handleEventSave = (eventData) => {
        // logic to save or update an event in Firestore
    };

    const handleEventDelete = (eventId) => {
        // logic to delete event from Firestore
    };

    const [activeTab, setActiveTab] = useState('markers'); // default tab




    const fetchMarkers = async () => {
        const querySnapshot = await getDocs(collection(db, 'markers'));
        const markersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setMarkers(markersData);
    };
    fetchMarkers();
    useEffect(() => {
        fetchMarkers();
    }, []);


    const handleSubmit = async () => {
        const { name, latitude, longitude, address, description, entranceFee, openingHours } = form;

        if (!name || !latitude || !longitude || !address || !description) {
            setPopup({ message: 'Please fill in all required fields.', status: 'error' });
            return;
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            setPopup({ message: 'Latitude and Longitude must be valid numbers.', status: 'error' });
            return;
        }

        if (entranceFee && isNaN(entranceFee)) {
            setPopup({ message: 'Entrance Fee must be a valid number.', status: 'error' });
            return;
        }

        const isTimeOverlap = Object.values(openingHours).some(({ open, close }) => open && close && open === close);
        if (isTimeOverlap) {
            setPopup({ message: 'Opening and closing times cannot be the same.', status: 'error' });
            return;
        }

        setLoading(true);
        const finalCategory = form.categoryOption === 'Other' ? form.customCategory : form.categoryOption;

        const newMarkerData = {
            ...form,
            id: editingId || Date.now(),
            category: finalCategory,
        };

        try {
            const docRef = doc(db, "markers", String(newMarkerData.id));
            await setDoc(docRef, newMarkerData);

            await fetchMarkers(); // 🔁 refresh data after save

            setPopup({ message: isEditing ? 'Marker updated successfully!' : 'Marker added successfully!', status: 'success' });

            setForm(getEmptyForm());
            setIsModalOpen(false);
            setIsEditing(false);
            setEditingId(null);
        } catch (error) {
            console.error('Error saving marker: ', error);
            setPopup({ message: 'Error occurred. Please try again.', status: 'error' });
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (marker) => {
        const isCustom = !['Historical', 'Restaurant', 'Park', 'Museum'].includes(marker.category);
        setForm({
            ...marker,
            categoryOption: isCustom ? 'Other' : marker.category,
            customCategory: isCustom ? marker.category : '',
        });
        setEditingId(marker.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this marker?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'markers', String(id)));
            setMarkers(prev => prev.filter(marker => marker.id !== id));
            setPopup({ message: 'Marker deleted successfully!', status: 'success' });
        } catch (error) {
            console.error('Error deleting marker: ', error);
            setPopup({ message: 'Error occurred while deleting the marker.', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const filteredMarkers = markers.filter(marker =>
        marker.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddMarkerClick = () => {
        setForm(getEmptyForm());
        setEditingId(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>Markers Management</h2>
                <div className="mtab-buttons">
                    <button
                        className={`mtab ${activeTab === 'markers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('markers')}
                    >
                        Manage Markers
                    </button>
                    <button
                        className={`mtab ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Manage Events
                    </button>
                </div>


                {popup.message && (
                    <div className={`popup-message ${popup.status}`}>
                        {popup.message}
                    </div>
                )}

                {activeTab === 'markers' && (
                    <>
                        <div className="top-controls">
                            <input
                                type="text"
                                placeholder="Search markers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button onClick={handleAddMarkerClick}>Add New Marker</button>
                        </div>

                        <div className="markers-list">
                            {filteredMarkers.map(marker => (
                                <div key={marker.id} className="marker-card">
                                    <img
                                        src={marker.image}
                                        alt={marker.name}
                                        onClick={() => setPreviewMarker(marker)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <h4>{marker.name}</h4>
                                    <p>{marker.category}</p>
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(marker)}>Edit</button>
                                        <button onClick={() => handleDelete(marker.id)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "events" && (
                    <>
                        <div className="top-controls">
                            <h3>Event Schedule</h3>
                            <button onClick={() => {
                                setSelectedDate(new Date()); // ✅ Ensure selectedDate is set
                                setEditingEvent(null);
                                setIsEventModalOpen(true);
                            }}>
                                + Add Event
                            </button>

                        </div>

                        <div className="event-calendar-wrapper">
                            <EventCalendar
                                events={events}
                                onDateSelect={(date) => setSelectedDate(date)}
                                onEventClick={(event) => {
                                    setEditingEvent(event);
                                    setIsEventModalOpen(true);
                                }}
                            />
                        </div>

                        <EventFormModal
                            isOpen={isEventModalOpen}
                            formData={eventForm}
                            setFormData={setEventForm}
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleEventSave(eventForm);
                                setIsEventModalOpen(false);
                                setEditingEvent(null);
                                setEventForm({ title: '', description: '', date: '', time: '' });
                            }}
                            onCancel={() => {
                                setIsEventModalOpen(false);
                                setEditingEvent(null);
                            }}
                        />

                    </>
                )}


                {
                    isModalOpen && (
                        <MarkerFormModal
                            form={form}
                            setForm={setForm}
                            onSubmit={handleSubmit}
                            onCancel={() => setIsModalOpen(false)}
                            loading={loading}
                            isEditing={isEditing}
                        />
                    )
                }


                {
                    previewMarker && (
                        <div className="image-preview-popup" onClick={() => setPreviewMarker(null)}>
                            <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
                                <img src={previewMarker.image} alt={previewMarker.name} />
                                <h3>{previewMarker.name}</h3>
                                <button onClick={() => setPreviewMarker(null)}>Close</button>
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default MarkersManagement;
