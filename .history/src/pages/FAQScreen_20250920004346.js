import React, { useEffect, useState } from "react";
import { getDoc, doc } from "firebase/firestore";
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
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                // ✅ Fetch single document "latest" inside "faqs"
                const faqDocRef = doc(db, "faqs", "latest");
                const faqDoc = await getDoc(faqDocRef);

                if (faqDoc.exists()) {
                    const data = faqDoc.data();

                    // ✅ Convert { question1, answer1, ... } into array
                    const faqList = [];
                    let i = 1;
                    while (data[`question${i}`]) {
                        faqList.push({
                            id: i,
                            question: data[`question${i}`],
                            answer: data[`answer${i}`] || "",
                        });
                        i++;
                    }

                    setFaqs(faqList);
                } else {
                    console.warn("No FAQs document found.");
                }
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
