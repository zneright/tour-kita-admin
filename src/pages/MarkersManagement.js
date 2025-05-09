import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './MarkersManagement.css';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { storage, db } from '../firebase'; // Import storage and db from your firebase.js

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
        openingHours: {
            monday: '',
            tuesday: '',
            wednesday: '',
            thursday: '',
            friday: '',
            saturday: '',
            sunday: ''
        }
    });
    const [imageMode, setImageMode] = useState('url');
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ message: '', status: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const storageRef = ref(storage, 'markers/' + file.name);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error("Error uploading image: ", error);
                    setPopup({ message: 'Error uploading image.', status: 'error' });
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setForm({ ...form, image: downloadURL });
                    console.log("File available at: ", downloadURL);
                }
            );
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.latitude || !form.longitude) {
            setPopup({ message: 'Please fill in all required fields.', status: 'error' });
            return;
        }

        if (isNaN(form.latitude) || isNaN(form.longitude)) {
            setPopup({ message: 'Latitude and Longitude must be valid numbers.', status: 'error' });
            return;
        }

        if (form.entranceFee && isNaN(form.entranceFee)) {
            setPopup({ message: 'Entrance Fee must be a valid number.', status: 'error' });
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
                openingHours: {
                    monday: '',
                    tuesday: '',
                    wednesday: '',
                    thursday: '',
                    friday: '',
                    saturday: '',
                    sunday: ''
                }
            });
            setImageMode('url');
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
            openingHours: {
                monday: '',
                tuesday: '',
                wednesday: '',
                thursday: '',
                friday: '',
                saturday: '',
                sunday: ''
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

                <div className="markers-list">
                    {filteredMarkers.map(marker => (
                        <div key={marker.id} className="marker-card">
                            <img src={marker.image} alt={marker.name} />
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

                                <label>Image Mode</label>
                                <select value={imageMode} onChange={(e) => setImageMode(e.target.value)}>
                                    <option value="url">Use Image URL</option>
                                    <option value="upload">Upload Image</option>
                                </select>

                                {imageMode === 'url' ? (
                                    <input name="image" placeholder="Image URL" value={form.image} onChange={handleChange} />
                                ) : (
                                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                                )}

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

                                <label>Opening Hours</label>
                                {Object.keys(form.openingHours).map(day => (
                                    <div key={day}>
                                        <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                        <input
                                            name={day}
                                            value={form.openingHours[day]}
                                            onChange={handleChange}
                                            placeholder="e.g. 9:00 AM - 5:00 PM"
                                        />
                                    </div>
                                ))}

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
            </main>
        </div>
    );
};

export default MarkersManagement;
