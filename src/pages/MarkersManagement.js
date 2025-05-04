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
    const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false); // To control the button disabling
    const [popup, setPopup] = useState({ message: '', status: '' }); // For displaying pop-ups (message + success/error status)

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
    }, []); // Run this effect once when the component mounts

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
            // Upload image to Firebase Storage
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
            // Save to Firestore
            const docRef = doc(db, "markers", String(newMarkerData.id));
            await setDoc(docRef, newMarkerData);

            if (editingId) {
                setMarkers(markers.map(m => m.id === editingId ? newMarkerData : m));
                setEditingId(null);
                setPopup({ message: 'Marker updated successfully!', status: 'success' });
            } else {
                setMarkers([...markers, newMarkerData]);
                setPopup({ message: 'Marker added successfully!', status: 'success' });
            }

            // Reset form 
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
        setImageMode(marker.image.startsWith('blob:') ? 'upload' : 'url');
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this marker?");
        if (confirmDelete) {
            setLoading(true);
            try {
                // Delete marker from Firestore
                const markerRef = doc(db, 'markers', String(id));
                await deleteDoc(markerRef);

                setMarkers(markers.filter(marker => marker.id !== id));
                setPopup({ message: 'Marker deleted successfully!', status: 'success' });
                if (editingId === id) {
                    setForm({
                        id: '',
                        name: '',
                        image: '',
                        latitude: '',
                        longitude: '',
                        entranceFee: '',
                        address: '',
                        description: '',
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
                    setImageMode('url');
                }
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

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>Markers Management</h2>

                {/*pop up */}
                {popup.message && (
                    <div className={`popup-message ${popup.status}`}>
                        {popup.message}
                    </div>
                )}

                <form className="marker-form" onSubmit={(e) => e.preventDefault()}>
                    <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />

                    <label>Image Mode</label>
                    <select value={imageMode} onChange={(e) => setImageMode(e.target.value)}>
                        <option value="url">Use Image URL</option>
                        <option value="upload">Upload Image</option>
                    </select>

                    {imageMode === 'url' ? (
                        <input
                            name="image"
                            placeholder="Image URL"
                            value={form.image}
                            onChange={handleChange}
                        />
                    ) : (
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                    )}

                    {form.image && (
                        <img
                            src={form.image}
                            alt="Preview"
                            className="preview-img"
                        />
                    )}

                    <input name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} />
                    <input name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} />
                    <input name="entranceFee" placeholder="Entrance Fee" value={form.entranceFee} onChange={handleChange} />
                    <input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
                    <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />

                    <label>Category</label>
                    <select name="categoryOption" value={form.categoryOption} onChange={handleChange}>
                        <option value="">Select category</option>
                        <option value="Historical">Historical</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Park">Park</option>
                        <option value="Museum">Museum</option>
                        <option value="Other">Other</option>
                    </select>

                    {form.categoryOption === 'Other' && (
                        <input
                            type="text"
                            name="customCategory"
                            placeholder="Custom category"
                            value={form.customCategory}
                            onChange={handleChange}
                        />
                    )}

                    <div className="opening-hours">
                        <h3>Opening Hours</h3>
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                            <div key={day}>
                                <label>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                <input
                                    type="text"
                                    name={day}
                                    placeholder="Opening time (e.g., 9:00 AM - 5:00 PM) or Closed"
                                    value={form.openingHours[day]}
                                    onChange={handleChange}
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="send-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {editingId ? 'Update Marker' : 'Add Marker'}
                    </button>
                </form>

                <input
                    type="text"
                    placeholder="Search landmark..."
                    className="search-bar"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="marker-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Lat</th>
                                <th>Lng</th>
                                <th>Opening Hours</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMarkers.map((marker) => (
                                <tr key={marker.id}>
                                    <td><img src={marker.image} alt="Marker" className="marker-img" /></td>
                                    <td>{marker.name}</td>
                                    <td>{marker.category}</td>
                                    <td>{marker.latitude}</td>
                                    <td>{marker.longitude}</td>
                                    <td>{Object.keys(marker.openingHours).map(day => (
                                        <div key={day}>{`${day.charAt(0).toUpperCase() + day.slice(1)}: ${marker.openingHours[day]}`}</div>
                                    ))}</td>
                                    <td>
                                        <button onClick={() => handleEdit(marker)}>Edit</button>
                                        <button onClick={() => handleDelete(marker.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default MarkersManagement;
