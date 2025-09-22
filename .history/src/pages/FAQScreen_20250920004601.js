import React, { useEffect, useState } from "react";
import { db } from "../firebase"; // adjust your Firebase import path
import { doc, getDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";

import "./FAQ.css"; // put the CSS you gave in this file

export default function FAQ() {
    const [faqItems, setFaqItems] = useState([]);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const faqRef = doc(db, "faq", "latest");
                const faqSnap = await getDoc(faqRef);

                if (faqSnap.exists()) {
                    const data = faqSnap.data();
                    setFaqItems(data.items || []);
                }
            } catch (error) {
                console.error("Error fetching FAQs:", error);
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

                {faqItems.map((item, index) => (
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
                ))}

                <div className="last-updated">
                    Last updated: August 25, 2025
                </div>
            </div>
        </div>
    );
}
