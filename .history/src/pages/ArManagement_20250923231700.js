import React, { useState, useEffect } from "react";
import "./ARManagement.css";
import { FiBox, FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_UPLOAD_PRESET = "ar_upload"; // no spaces!
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null,
        model: null,
        audioFiles: [],
        videoFiles: [],
        location: "",
    });

    const [markers, setMarkers] = useState([]);

    // Fetch markers for location dropdown
    useEffect(() => {
        const fetchMarkers = async () => {
            const snapshot = await getDocs(collection(db, "markers"));
            setMarkers(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        fetchMarkers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === "audioFiles" || name === "videoFiles") {
            setFormData(prev => ({ ...prev, [name]: Array.from(files) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const uploadToCloudinary = async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await axios.post(CLOUDINARY_API_URL, data);
        return res.data.secure_url;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Upload files to Cloudinary
            const imageUrl = await uploadToCloudinary(formData.image);
            const modelUrl = await uploadToCloudinary(formData.model);

            const audioUrls = await Promise.all(formData.audioFiles.map(uploadToCloudinary));
            const videoUrls = await Promise.all(formData.videoFiles.map(uploadToCloudinary));

            await addDoc(collection(db, "arAssets"), {
                name: formData.name,
                description: formData.description,
                location: formData.location,
                imageUrl,
                modelUrl,
                audioUrls,
                videoUrls,
                createdAt: serverTimestamp(),
            });

            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                const markerRef = doc(db, "markers", selectedMarker.id);
                await updateDoc(markerRef, { arCameraSupported: true });
            }

            alert("AR Asset uploaded successfully!");
            setShowUploadForm(false);
            setFormData({
                name: "",
                description: "",
                image: null,
                model: null,
                audioFiles: [],
                videoFiles: [],
                location: "",
            });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload AR Asset. Check console for details.");
        }
    };

    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="dashboard-section">
                <div className="ar-header">
                    <h2>AR Asset Management</h2>
                </div>

                <div className="ar-top-controls">
                    <button onClick={() => setShowUploadForm(true)}>
                        <FiPlusCircle style={{ marginRight: "6px" }} />
                        Add New AR Assets
                    </button>
                </div>

                {!showUploadForm && (
                    <div className="ar-grid">
                        {[...Array(6)].map((_, idx) => (
                            <div className="ar-card" key={idx}>
                                <div className="ar-icon">
                                    <FiBox size={48} />
                                </div>
                                <h3>AR Content #{idx + 1}</h3>
                                <p>Preview or description placeholder</p>
                            </div>
                        ))}
                    </div>
                )}

                {showUploadForm && (
                    <div className="upload-modal">
                        <form className="upload-form" onSubmit={handleSubmit}>
                            <h2>Upload AR Asset</h2>

                            <label>
                                Name:
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </label>

                            <label>
                                Description:
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    required
                                />
                            </label>

                            <label>
                                Location:
                                <select
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Location</option>
                                    {markers.map(marker => (
                                        <option key={marker.id} value={marker.name}>
                                            {marker.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Preview Image:
                                <input
                                    type="file"
                                    name="image"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                />
                            </label>

                            <label>
                                3D Model File (.obj, .glb):
                                <input
                                    type="file"
                                    name="model"
                                    accept=".obj,.glb,.gltf"
                                    onChange={handleFileChange}
                                    required
                                />
                            </label>

                            <label>
                                Audio Files:
                                <input
                                    type="file"
                                    name="audioFiles"
                                    accept="audio/*"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </label>

                            <label>
                                Video Files:
                                <input
                                    type="file"
                                    name="videoFiles"
                                    accept="video/*"
                                    onChange={handleFileChange}
                                    multiple
                                />
                            </label>

                            <div className="arform-actions">
                                <button type="submit">Submit</button>
                                <button type="button" onClick={() => setShowUploadForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArManagement;
