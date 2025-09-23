import React, { useState, useEffect } from "react";
import "..pages";
import axios from "axios";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_UPLOAD_PRESET = "ar_upload";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null,
        model: null,
        audioFiles: [],
        videoFiles: [],
        location: "",
    });

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
            onClose(); // close modal and reset form
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload AR Asset. Check console for details.");
        }
    };

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Asset</h2>

                <label>
                    Name:
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </label>

                <label>
                    Description:
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required />
                </label>

                <label>
                    Location:
                    <select name="location" value={formData.location} onChange={handleInputChange} required>
                        <option value="">Select Location</option>
                        {markers.map(marker => (
                            <option key={marker.id} value={marker.name}>{marker.name}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Preview Image:
                    <input type="file" name="image" accept="image/*" onChange={handleFileChange} required />
                </label>

                <label>
                    3D Model File (.obj, .glb):
                    <input type="file" name="model" accept=".obj,.glb,.gltf" onChange={handleFileChange} required />
                </label>

                <label>
                    Audio Files:
                    <input type="file" name="audioFiles" accept="audio/*" onChange={handleFileChange} multiple />
                </label>

                <label>
                    Video Files:
                    <input type="file" name="videoFiles" accept="video/*" onChange={handleFileChange} multiple />
                </label>

                <div className="arform-actions">
                    <button type="submit">Submit</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;
