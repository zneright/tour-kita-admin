// ReportsPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, 22, { align: "right" });

    // === SUMMARY CARDS ===
    const ratings = feedbacks.map(f => f.rating).filter(r => typeof r === "number");
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "N/A";

    const topLocation = (() => {
        const locMap = {};
        feedbacks.forEach(f => {
            if (!f.location || typeof f.rating !== "number") return;
            if (!locMap[f.location]) locMap[f.location] = [];
            locMap[f.location].push(f.rating);
        });
        let top = { name: "N/A", rating: 0 };
        Object.entries(locMap).forEach(([loc, arr]) => {
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            if (avg > top.rating) top = { name: loc, rating: avg.toFixed(1) };
        });
        return top;
    })();

    const guestUsers = users.filter(u => u.userType === "guest");
    const registeredUsers = users.length;

    const cards = [
        { title: "Average Rating", value: avgRating },
        { title: "Registered Users", value: registeredUsers },
        { title: "Guest Users", value: guestUsers.length },
        { title: "Top Destination", value: `${topLocation.name} (${topLocation.rating})` },
    ];

    cards.forEach((c, idx) => {
        doc.setFontSize(12);
        doc.text(c.title, margin, 35 + idx * 10);
        doc.setFontSize(14);
        doc.text(`${c.value}`, margin + 60, 35 + idx * 10);
    });

    // === FEEDBACK TABLES ===
    doc.setFontSize(12);
    doc.text("Feedback Overview", margin, 80);

    const locationFeedbacks = feedbacks
        .filter(f => f.feedbackType === "Location Feedback" && typeof f.rating === "number")
        .reduce((acc, f) => {
            if (!acc[f.location]) acc[f.location] = [];
            acc[f.location].push(f.rating);
            return acc;
        }, {});

    const locationData = Object.entries(locationFeedbacks).map(([loc, arr]) => ({
        Location: loc,
        AvgRating: (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
        Count: arr.length,
    }));

    autoTable(doc, {
        startY: 85,
        head: [["Location", "Average Rating", "Feedback Count"]],
        body: locationData.map(d => [d.Location, d.AvgRating, d.Count]),
        theme: "grid",
        headStyles: { fillColor: "#3498DB" },
        styles: { fontSize: 10 },
    });

    // === APP FEEDBACK ===
    const appFeedbacks = feedbacks
        .filter(f => f.feedbackType === "App Feedback" && typeof f.rating === "number")
        .reduce((acc, f) => {
            if (!acc[f.feature]) acc[f.feature] = [];
            acc[f.feature].push(f.rating);
            return acc;
        }, {});

    const appData = Object.entries(appFeedbacks).map(([feat, arr]) => ({
        Feature: feat,
        AvgRating: (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1),
        Count: arr.length,
    }));

    let lastY = doc.lastAutoTable.finalY + 10;
    doc.text("App Feedback Overview", margin, lastY);
    autoTable(doc, {
        startY: lastY + 5,
        head: [["Feature", "Average Rating", "Feedback Count"]],
        body: appData.map(d => [d.Feature, d.AvgRating, d.Count]),
        theme: "grid",
        headStyles: { fillColor: "#E67E22" },
        styles: { fontSize: 10 },
    });

    // === USER DISTRIBUTION TABLE ===
    const ageGroups = users.reduce((acc, u) => {
        const age = u.age || 0;
        const group = age >= 90 ? "90+" : `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
        acc[group] = (acc[group] || 0) + 1;
        return acc;
    }, {});

    const genderCounts = users.reduce((acc, u) => {
        const g = u.gender || "Prefer Not to Say";
        acc[g] = (acc[g] || 0) + 1;
        return acc;
    }, {});

    lastY = doc.lastAutoTable.finalY + 10;
    doc.text("User Distribution", margin, lastY);

    autoTable(doc, {
        startY: lastY + 5,
        head: [["Category", "Group", "Count"]],
        body: [
            ...Object.entries(ageGroups).map(([group, count]) => ["Age Group", group, count]),
            ...Object.entries(genderCounts).map(([group, count]) => ["Gender", group, count]),
        ],
        theme: "grid",
        headStyles: { fillColor: "#2ECC71" },
        styles: { fontSize: 10 },
    });

    // === SAVE PDF ===
    doc.save(`TourKita_Report_${moment().format("YYYYMMDD_HHmmss")}.pdf`);
};
