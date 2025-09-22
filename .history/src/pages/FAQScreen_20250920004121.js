import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import LegalSidebar from "../components/HelpSidebar";
import "./LegalPages.css";
import "./FAQScreen.css";

const SkeletonFAQ = () => (
    <div className="skeleton-faq">
        <div className="skeleton skeleton-faq-title"></div>
        <div className="skeleton skeleton-faq-answer"></div>
    </div>
);

const FAQScreen = () => {
    const [faqs, setFaqs] = useState([]); // ✅ fixed
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "faqs"));
                const faqList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFaqs(faqList);
            } catch (error) {
                console.error("Error fetching FAQs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFAQs();
    }, []);

    return (
        <div className="legal-container">
            <LegalSidebar />
            <div className="legal-content">
                <h1>FAQs</h1>

                {/* ✅ Skeleton loader while fetching */}
                {loading ? (
                    <>
                        <SkeletonFAQ />
                        <SkeletonFAQ />
                        <SkeletonFAQ />
                    </>
                ) : faqs.length > 0 ? (
                    faqs.map((faq) => (
                        <div key={faq.id} className="faq-item">
                            <h3>{faq.question}</h3>
                            <p>{faq.answer}</p>
                        </div>
                    ))
                ) : (
                    <p>No FAQs available.</p>
                )}
            </div>
        </div>
    );
};

export default FAQScreen;
