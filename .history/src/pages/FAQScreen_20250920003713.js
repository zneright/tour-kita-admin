import React, { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import LegalSidebar from "../components/HelpSidebar";
import "./LegalPages.css";
import "./FAQScreen.css";

const SkeletonFAQ = () => (
    <div className="skeleton-faq">
        <div className="skeleton skeleton-faq-title"></div>
        <div className="skeleton-faq-item">
            <div className="skeleton skeleton-faq-q"></div>
            <div className="skeleton skeleton-faq-a"></div>
        </div>
        <div className="skeleton-faq-item">
            <div className="skeleton skeleton-faq-q"></div>
            <div className="skeleton skeleton-faq-a"></div>
        </div>
        <div className="skeleton-faq-item">
            <div className="skeleton skeleton-faq-q"></div>
            <div className="skeleton skeleton-faq-a"></div>
        </div>
    </div>
);

const FAQScreen = () => {
    const [faqs, setFaqs] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const docRef = doc(db, "faq", "latest");
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    const data = snapshot.data();
                    console.log("RAW FAQ Data:", data);

                    // since items is an array, we can safely use it
                    const items = Array.isArray(data.items) ? data.items : [];
                    console.log("Final FAQ items:", items);

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
                {loading ? (
                    <SkeletonFAQ />
                ) : faqs.length === 0 ? (
                    <p>No FAQs available.</p>
                ) : (
                    faqs.map((faq, index) => (
                        <div key={index} className="faq-item">
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="faq-button"
                            >
                                {faq.question}
                                <span className={`faq-arrow ${expandedIndex === index ? "expanded" : ""}`}>
                                    ▼
                                </span>
                            </button>
                            {expandedIndex === index && (
                                <div className="faq-answer">
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
