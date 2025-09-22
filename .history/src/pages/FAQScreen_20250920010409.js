import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { ChevronDown, ChevronUp } from "lucide-react";

import "./FAQ.css";

export default function FAQ() {
    const [faqItems, setFaqItems] = useState([]);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const faqRef = collection(db, "faq"); // fetch all docs inside faq
                const faqSnap = await getDocs(faqRef);

                const items = faqSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setFaqItems(items);
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
                            key={item.id}
                            className="faq-item"
                            onClick={() => toggleFAQ(index)}
                        >
                            <div className="faq-question">
                                <span>{item.question}</span>
                                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            {openIndex === index && (
                                <div className="faq-answer">
                                    <p>{item.answer}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No FAQs found in Firestore.</p>
                )}
            </div>
        </div>
    );
}
