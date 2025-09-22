import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // adjust this to your firebase.js file
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";

import "./FAQScreem.css";

export default function FAQ() {
    const [faqItems, setFaqItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState("");
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const faqRef = doc(db, "faq", "latest"); // collection: faq, doc: latest
                const faqSnap = await getDoc(faqRef);

                if (faqSnap.exists()) {
                    const data = faqSnap.data();

                    // ✅ Read items array
                    if (data.items && Array.isArray(data.items)) {
                        setFaqItems(data.items);
                    } else {
                        console.warn("No items array found in Firestore.");
                    }

                    // ✅ Handle timestamp
                    if (data.timestamp instanceof Timestamp) {
                        const date = data.timestamp.toDate();
                        setLastUpdated(
                            date.toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })
                        );
                    } else if (typeof data.timestamp === "string") {
                        setLastUpdated(data.timestamp);
                    }
                } else {
                    console.warn("FAQ document does not exist.");
                }
            } catch (err) {
                console.error("Error fetching FAQs:", err);
            }
        };

        fetchFAQs();
    }, []);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="legal-wrapper">
            <div className="legal-content">
                <h2>Frequently Asked Questions</h2>

                {faqItems.length > 0 ? (
                    faqItems.map((item, index) => (
                        <div
                            key={index}
                            className="faq-item"
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="faq-question">
                                <span>{item.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </div>

                            {openIndex === index && (
                                <div className="faq-answer">
                                    <p>{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No FAQs available in Firestore.</p>
                )}

                <div className="last-updated">
                    {lastUpdated ? `Last updated: ${lastUpdated}` : ""}
                </div>
            </div>
        </div>
    );
}
