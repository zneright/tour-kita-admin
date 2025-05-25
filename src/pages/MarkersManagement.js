import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './MarkersManagement.css';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const MarkersManagement = () => {
    const [markers, setMarkers] = useState([]);
    const [form, setForm] = useState({
        id: '',
        name: '',
        image: '',
        latitude: '',
        longitude: '',
        entranceFee: '',
        address: '',
        description: '',
        categoryOption: '',
        customCategory: '',
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
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ message: '', status: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previewMarker, setPreviewMarker] = useState(null);
    const [copyDay, setCopyDay] = useState(null);
    const [copyTargets, setCopyTargets] = useState([])
    useEffect(() => {
        const fetchMarkers = async () => {
            const querySnapshot = await getDocs(collection(db, 'markers'));
            const markersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMarkers(markersData);
        };
        fetchMarkers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name in form.openingHours) {
            setForm({
                ...form,
                openingHours: {
                    ...form.openingHours,
                    [name]: value
                }
            });
        } else {
            setForm({ ...form, [name]: value });
        }
    };


    const handleSubmit = async () => {
        if (!form.name || !form.latitude || !form.longitude || !form.address || !form.description) {
            alert('Please fill in all required fields.');
            setPopup({ message: 'Please fill in all required fields.', status: 'error' });
            return;
        }

        if (isNaN(form.latitude) || isNaN(form.longitude)) {
            alert('Latitude and Longitude must be valid numbers.');
            setPopup({ message: 'Latitude and Longitude must be valid numbers.', status: 'error' });
            return;
        }

        if (form.entranceFee && isNaN(form.entranceFee)) {
            alert('Entrance Fee must be a valid number.');
            setPopup({ message: 'Entrance Fee must be a valid number.', status: 'error' });
            return;
        }
        const isTimeOverlap = Object.keys(form.openingHours).some(day => {
            const { open, close } = form.openingHours[day];
            return open && close && open === close;
        });

        if (isTimeOverlap) {
            alert('Opening and closing times cannot be the same.');
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

            if (isEditing) {
                setMarkers(markers.map(m => m.id === editingId ? newMarkerData : m));
                setEditingId(null);
                setPopup({ message: 'Marker updated successfully!', status: 'success' });
            } else {
                setMarkers([...markers, newMarkerData]);
                setPopup({ message: 'Marker added successfully!', status: 'success' });
            }

            setForm({
                id: '',
                name: '',
                image: '',
                latitude: '',
                longitude: '',
                entranceFee: '',
                address: '',
                description: '',
                categoryOption: '',
                customCategory: '',
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
            setIsModalOpen(false);
            setIsEditing(false);
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
        if (confirmDelete) {
            setLoading(true);
            try {
                const markerRef = doc(db, 'markers', String(id));
                await deleteDoc(markerRef);

                setMarkers(markers.filter(marker => marker.id !== id));
                setPopup({ message: 'Marker deleted successfully!', status: 'success' });
            } catch (error) {
                console.error('Error deleting marker: ', error);
                setPopup({ message: 'Error occurred while deleting the marker.', status: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredMarkers = markers.filter(marker =>
        marker.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddMarkerClick = () => {
        setForm({
            id: '',
            name: '',
            image: '',
            latitude: '',
            longitude: '',
            entranceFee: '',
            address: '',
            description: '',
            categoryOption: '',
            customCategory: '',
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
        setEditingId(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>Markers Management</h2>

                {popup.message && (
                    <div className={`popup-message ${popup.status}`}>
                        {popup.message}
                    </div>
                )}

                <div className="top-controls">
                    <input
                        type="text"
                        placeholder="Search markers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={handleAddMarkerClick}>Add New Marker</button>
                </div>

                <div className="markers-list grid grid-cols-4 gap-4">
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

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <form className="marker-form" onSubmit={(e) => e.preventDefault()}>
                                <label>Name</label>
                                <input name="name" value={form.name} onChange={handleChange} />
                                <label>Image Url</label>
                                <input name="image" value={form.image} onChange={handleChange} />


                                {form.image && (
                                    <div className="preview-container">
                                        <img src={form.image} alt="Preview" className="preview-img" />
                                    </div>
                                )}

                                <label>Latitude</label>
                                <input name="latitude" value={form.latitude} onChange={handleChange} />

                                <label>Longitude</label>
                                <input name="longitude" value={form.longitude} onChange={handleChange} />

                                <label>Entrance Fee</label>
                                <input name="entranceFee" value={form.entranceFee} onChange={handleChange} />

                                <label>Address</label>
                                <input name="address" value={form.address} onChange={handleChange} />

                                <label>Description</label>
                                <textarea name="description" value={form.description} onChange={handleChange}></textarea>

                                <label>Category</label>
                                <select name="categoryOption" value={form.categoryOption} onChange={handleChange}>
                                    <option value="Historical">Historical</option>
                                    <option value="Restaurant">Restaurant</option>
                                    <option value="Park">Park</option>
                                    <option value="Museum">Museum</option>
                                    <option value="Other">Other</option>
                                </select>

                                {form.categoryOption === 'Other' && (
                                    <input
                                        name="customCategory"
                                        placeholder="Custom Category"
                                        value={form.customCategory}
                                        onChange={handleChange}
                                    />
                                )}
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        name="arCameraSupported"
                                        checked={form.arCameraSupported || false}
                                        onChange={(e) => setForm(prev => ({ ...prev, arCameraSupported: e.target.checked }))}
                                    />
                                    <label htmlFor="arCameraSupported">AR Camera Supported</label>
                                </div>

                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        name="accessibleRestrooms"
                                        checked={form.accessibleRestrooms || false}
                                        onChange={(e) => setForm(prev => ({ ...prev, accessibleRestrooms: e.target.checked }))}
                                    />
                                    <label htmlFor="accessibleRestrooms">Accessible Restrooms</label>
                                </div>

                                <label>Opening Hours</label>
                                {Object.keys(form.openingHours).map(day => {
                                    const dayData = form.openingHours[day];
                                    const otherDays = Object.keys(form.openingHours).filter(d => d !== day);

                                    return (
                                        <div key={day} className="opening-hours-container">
                                            <label className="opening-hours-day-label">
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                            </label>

                                            <div className="opening-hours-row">
                                                <input
                                                    type="checkbox"
                                                    checked={dayData.closed || false}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setForm(prevForm => ({
                                                            ...prevForm,
                                                            openingHours: {
                                                                ...prevForm.openingHours,
                                                                [day]: checked
                                                                    ? { closed: true }
                                                                    : { open: '', close: '', closed: false }
                                                            }
                                                        }));
                                                    }}
                                                />
                                                <span>Closed</span>

                                                {!dayData.closed && (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={dayData.open}
                                                            onChange={(e) =>
                                                                setForm(prevForm => ({
                                                                    ...prevForm,
                                                                    openingHours: {
                                                                        ...prevForm.openingHours,
                                                                        [day]: {
                                                                            ...prevForm.openingHours[day],
                                                                            open: e.target.value
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                        />
                                                        <span>to</span>
                                                        <input
                                                            type="time"
                                                            value={dayData.close}
                                                            onChange={(e) =>
                                                                setForm(prevForm => ({
                                                                    ...prevForm,
                                                                    openingHours: {
                                                                        ...prevForm.openingHours,
                                                                        [day]: {
                                                                            ...prevForm.openingHours[day],
                                                                            close: e.target.value
                                                                        }
                                                                    }
                                                                }))
                                                            }
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCopyDay(day);
                                                                setCopyTargets([]);
                                                            }}
                                                            className="opening-hours-copy-button"
                                                        >
                                                            Copy to...
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Copy to modal/section */}
                                            {copyDay === day && (
                                                <div className="opening-hours-copy-modal">
                                                    <p>Select days to copy opening hours to:</p>
                                                    {otherDays.map(d => (
                                                        <label key={d} className="opening-hours-copy-target-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={copyTargets.includes(d)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setCopyTargets(prev =>
                                                                        checked ? [...prev, d] : prev.filter(day => day !== d)
                                                                    );
                                                                }}
                                                            />
                                                            {d.charAt(0).toUpperCase() + d.slice(1)}
                                                        </label>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(prevForm => {
                                                                const newOpeningHours = { ...prevForm.openingHours };
                                                                copyTargets.forEach(targetDay => {
                                                                    newOpeningHours[targetDay] = {
                                                                        open: prevForm.openingHours[copyDay].open,
                                                                        close: prevForm.openingHours[copyDay].close,
                                                                        closed: false
                                                                    };
                                                                });
                                                                return {
                                                                    ...prevForm,
                                                                    openingHours: newOpeningHours
                                                                };
                                                            });
                                                            setCopyDay(null);
                                                            setCopyTargets([]);
                                                        }}
                                                        disabled={copyTargets.length === 0}
                                                        className="opening-hours-copy-action-button"
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCopyDay(null);
                                                            setCopyTargets([]);
                                                        }}
                                                        className="opening-hours-cancel-button"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}


                                <div className="form-actions">
                                    <button type="button" onClick={handleSubmit} disabled={loading}>
                                        {loading ? 'Saving...' : isEditing ? 'Update Marker' : 'Add Marker'}
                                    </button>
                                    <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {previewMarker && (
                    <div className="image-preview-popup" onClick={() => setPreviewMarker(null)}>
                        <div className="image-popup-content" onClick={(e) => e.stopPropagation()}>
                            <img src={previewMarker.image} alt={previewMarker.name} />
                            <h3>{previewMarker.name}</h3>
                            <button onClick={() => setPreviewMarker(null)}>Close</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MarkersManagement;
