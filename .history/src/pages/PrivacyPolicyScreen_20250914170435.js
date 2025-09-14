import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import HelpSidebar from "../components/HelpSidebar";
import "./LegalPages.css";

const SkeletonTerms = () => (
    <div className="skeleton-terms">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line medium"></div>
    </div>
);

const TermsOfServiceScreen = () => {
    const [termsContent, setTermsContent] = useState([]);
    const [lastUpdated, setLastUpdated] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const docRef = doc(db, "privacy", "latest");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTermsContent(data.content || []);
                    const timestamp = data.timestamp?.toDate?.();
                    setLastUpdated(timestamp ? timestamp.toLocaleString() : "N/A");
                }
            } catch (error) {
                console.error("Error fetching terms of service:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, []);

    return (
        <div className="legal-wrapper">
            <HelpSidebar />
            <div className="legal-content">
                <h2>Privacy Policy</h2>
                {loading ? (
                    <SkeletonTerms />
                ) : (
                    <>
                        <p>
                            Welcome to TourKita! By using our app, you agree to the following terms:
                        </p>
                        <ul>
                            {termsContent.map((term, index) => (
                                <li key={index}>{term}</li>
                            ))}
                        </ul>
                        <p>
                            Continued use of TourKita means you accept any updated terms automatically.
                        </p>
                        <p className="last-updated">Last updated: {lastUpdated}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default TermsOfServiceScreen;
