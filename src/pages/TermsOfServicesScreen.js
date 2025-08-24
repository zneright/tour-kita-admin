import React, { useEffect, useState } from "react";
import HelpSidebar from "../components/HelpSidebar";
import "./LegalPages.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

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
    const [termsList, setTermsList] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const docRef = doc(db, "services", "latest");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setTermsList(data.content || []);
                    setLastUpdated(data.timestamp?.toDate());
                }
            } catch (error) {
                console.error("Error fetching terms:", error);
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
                <h2>Terms of Service</h2>
                {loading ? (
                    <SkeletonTerms />
                ) : (
                    <>
                        <p>Welcome to TourKita! By using our app, you agree to the following terms:</p>
                        <ul>
                            {termsList.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>

                        <p>Continued use of TourKita means you accept any updated terms automatically.</p>
                        {lastUpdated && (
                            <p className="last-updated">
                                Last updated: {lastUpdated.toLocaleDateString()} {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TermsOfServiceScreen;
