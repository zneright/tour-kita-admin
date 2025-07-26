import React, { useState } from "react";
import "./ARManagement.css";
import { FiBox, FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";

const ARManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null,
        model: null,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    const handleAddMarkerClick = () => {
        setShowUploadForm(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting:", formData);
        setShowUploadForm(false);
        setFormData({ name: "", description: "", image: null, model: null });
    };

    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="dashboard-section">

                <div className="ar-header">
                    <h2>AR Asset Management</h2>
                </div>
                <div className="ar-top-controls">
                    <button onClick={handleAddMarkerClick}>
                        <FiPlusCircle style={{ marginRight: "6px" }} />
                        Add New AR Assets
                    </button>
                </div>
                {!showUploadForm && (
                    <>
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


                    </>
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

                            <div className="form-actions">
                                <button type="submit">Submit</button>
                                <button type="button" onClick={() => setShowUploadForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ARManagement;
