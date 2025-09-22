import React, { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import LegalSidebar from "../components/HelpSidebar";
import "./LegalPages.css";
import "./FAQScreen.css";

const SkeletonFAQ = () => (
    <div className="skeleton-faq">
        <div className="skeleton skeleton-faq-title"></div>
        {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-faq-item">
                <div className="skeleton skeleton-faq-q"></div>
                <div className="skeleton skeleton-faq-a"></div>
            </div>
        ))}
    </div>
);

const FAQScreen = () => {
    const [faqs, setFaqs] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const docRef = doc(db, "faq", "latest"); // ✅ check spelling in Firestore
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    console.log("RAW FAQ Data:", data);

                    // ✅ Your `items` is already an array
                    const items = Array.isArray(data.items) ? data.items : [];
                    setFaqs(items);
                } else {
                    console.warn("FAQ document does not exist!");
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

    return (
        <div className="legal-wrapper">
            <LegalSidebar />
            <div className="legal-content">
                <h2>Frequently Asked Questions</h2>

                {loading && <SkeletonFAQ />}

                {!loading && faqs.length === 0 && (
                    <p>No FAQs available.</p>
                )}

                {!loading && faqs.length > 0 && (
                    faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="faq-button"
                            >
                                {faq?.question || "Untitled Question"}
                                <span
                                    className={`faq-arrow ${expandedIndex === index ? "expanded" : ""
                                        }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {expandedIndex === index && (
                                <div className="faq-answer">
                                    {faq?.answer || "No answer provided."}
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
