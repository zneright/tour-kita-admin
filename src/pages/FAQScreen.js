import React, { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import LegalSidebar from "../components/HelpSidebar";
import "./LegalPages.css";

const FAQScreen = () => {
    const [faqs, setFaqs] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const docRef = doc(db, "faq", "latest");
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setFaqs(snapshot.data().items || []);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
            }
        };
        fetchFAQs();
    }, []);

    const toggleFAQ = (index) => {
        setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    return (
        <div className="legal-wrapper">
            <LegalSidebar />
            <div className="legal-content">
                <h2>Frequently Asked Questions</h2>
                {faqs.length === 0 ? (
                    <p>No FAQs available.</p>
                ) : (
                    faqs.map((faq, index) => (
                        <div key={index} style={{ marginBottom: "1.5rem" }}>
                            <button
                                onClick={() => toggleFAQ(index)}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    width: "100%",
                                    fontSize: "1.1rem",
                                    fontWeight: "600",
                                    color: "#1f2937",
                                    background: "none",
                                    border: "none",
                                    padding: "0.5rem 0",
                                    cursor: "pointer"
                                }}
                            >
                                {faq.question}
                                <span
                                    style={{
                                        transform: expandedIndex === index ? "rotate(180deg)" : "rotate(0)",
                                        transition: "transform 0.2s",
                                    }}
                                >
                                    ▼
                                </span>
                            </button>
                            {expandedIndex === index && (
                                <div style={{ marginTop: "0.5rem", paddingLeft: "1rem", color: "#374151" }}>
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FAQScreen;
