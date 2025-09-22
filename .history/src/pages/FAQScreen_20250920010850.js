import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // ✅ adjust path if needed
import { doc, getDoc } from "firebase/firestore";

const FAQ = () => {
    const [faqs, setFaqs] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const faqRef = doc(db, "faq", "latest");
                const faqSnap = await getDoc(faqRef);

                if (faqSnap.exists()) {
                    const data = faqSnap.data();

                    // ✅ Handle both array & map stored in Firestore
                    if (Array.isArray(data.items)) {
                        setFaqs(data.items);
                    } else if (data.items && typeof data.items === "object") {
                        setFaqs(Object.values(data.items));
                    } else {
                        setFaqs([]);
                    }
                } else {
                    console.warn("FAQ document does not exist in Firestore.");
                    setFaqs([]);
                }
            } catch (err) {
                console.error("Failed to fetch FAQs:", err);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    const toggleFAQ = (index) => {
        setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    };

    if (loading) {
        return (
            <div className="legal-wrapper">
                <div className="legal-content">
                    <h2>Frequently Asked Questions</h2>
                    <p>Loading FAQs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="legal-wrapper">
            <div className="legal-content">
                <h2>Frequently Asked Questions</h2>

                {faqs.length === 0 ? (
                    <p>No FAQs available in Firestore.</p>
                ) : (
                    <div>
                        {faqs.map((faq, index) => (
                            <div key={index} style={{ marginBottom: "1rem" }}>
                                <button
                                    onClick={() => toggleFAQ(index)}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        width: "100%",
                                        padding: "0.75rem 1rem",
                                        border: "1px solid #ddd",
                                        borderRadius: "8px",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                    }}
                                >
                                    {faq.question}
                                    <span>{expandedIndex === index ? "▲" : "▼"}</span>
                                </button>

                                {expandedIndex === index && (
                                    <p
                                        style={{
                                            marginTop: "0.5rem",
                                            padding: "0.75rem 1rem",
                                            backgroundColor: "#f9f9f9",
                                            borderRadius: "6px",
                                            fontSize: "0.95rem",
                                            lineHeight: "1.6",
                                        }}
                                    >
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FAQ;
