// ReportsPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 10;

    // === Summary Cards ===
    const avgRating = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1) : 0;
    const registeredUsers = users.length;
    const guestUsers = users.filter(u => u.userType === 'guest').length;

    // Top rated location
    const locationRatings = {};
    feedbacks.forEach(f => {
        if (f.location && typeof f.rating === 'number') {
            if (!locationRatings[f.location]) locationRatings[f.location] = { total: 0, count: 0 };
            locationRatings[f.location].total += f.rating;
            locationRatings[f.location].count += 1;
        }
    });
    let topLocation = { name: "N/A", rating: 0 };
    Object.entries(locationRatings).forEach(([loc, { total, count }]) => {
        const avg = total / count;
        if (avg > topLocation.rating) topLocation = { name: loc, rating: avg };
    });

    const cards = [
        { title: "Average Rating", value: `${avgRating} ⭐` },
        { title: "Registered Users", value: registeredUsers.toLocaleString() },
        { title: "Guest Users", value: guestUsers.toLocaleString() },
        { title: "Top Destination", value: `${topLocation.name} (${topLocation.rating.toFixed(1)}⭐)` },
    ];

    cards.forEach((c, i) => {
        doc.setFontSize(12);
        doc.text(c.title, margin, currentY);
        doc.setFontSize(14);
        doc.text(`${c.value}`, margin + 60, currentY);
        currentY += 10;
    });

    currentY += 5;

    // === Feedback Overview ===
    doc.setFontSize(14);
    doc.text("Feedback Overview", margin, currentY);
    currentY += 5;

    const locationFeedbacks = Object.entries(locationRatings).map(([name, { total, count }]) => ({
        name,
        average: (total / count).toFixed(1),
        count
    })).sort((a, b) => b.average - a.average);

    const featureRatings = {};
    feedbacks.forEach(f => {
        if (f.feature && typeof f.rating === 'number') {
            if (!featureRatings[f.feature]) featureRatings[f.feature] = { total: 0, count: 0 };
            featureRatings[f.feature].total += f.rating;
            featureRatings[f.feature].count += 1;
        }
    });
    const appFeedbacks = Object.entries(featureRatings).map(([name, { total, count }]) => ({
        name,
        average: (total / count).toFixed(1),
        count
    })).sort((a, b) => b.average - a.average);

    // Location Feedback Table
    autoTable(doc, {
        startY: currentY,
        head: [['Location', 'Average Rating', 'Feedback Count']],
        body: locationFeedbacks.map(l => [l.name, l.average, l.count]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // App Feature Feedback Table
    doc.setFontSize(14);
    doc.text("App Feature Feedback", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [['Feature', 'Average Rating', 'Feedback Count']],
        body: appFeedbacks.map(f => [f.name, f.average, f.count]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === User Demographics ===
    doc.setFontSize(14);
    doc.text("User Demographics", margin, currentY);
    currentY += 5;

    // Age groups
    const ageGroups = {};
    users.forEach(u => {
        const age = u.age || 0;
        const group = age >= 90 ? "90+" : `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
        if (!ageGroups[group]) ageGroups[group] = 0;
        ageGroups[group]++;
    });
    autoTable(doc, {
        startY: currentY,
        head: [['Age Group', 'Count']],
        body: Object.entries(ageGroups).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 5;

    // Gender distribution
    const genderCounts = {};
    users.forEach(u => {
        const gender = u.gender || "Prefer Not to Say";
        if (!genderCounts[gender]) genderCounts[gender] = 0;
        genderCounts[gender]++;
    });
    autoTable(doc, {
        startY: currentY,
        head: [['Gender', 'Count']],
        body: Object.entries(genderCounts).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 5;

    // User Type distribution
    const userTypeCounts = {};
    users.forEach(u => {
        const type = u.userType || "Other";
        if (!userTypeCounts[type]) userTypeCounts[type] = 0;
        userTypeCounts[type]++;
    });
    autoTable(doc, {
        startY: currentY,
        head: [['User Type', 'Count']],
        body: Object.entries(userTypeCounts).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Summary / Insights ===
    doc.setFontSize(14);
    doc.text("Summary & Insights", margin, currentY);
    currentY += 5;

    const insights = [
        `Top destination: ${topLocation.name} with average rating ${topLocation.rating.toFixed(1)}⭐`,
        `Total registered users: ${registeredUsers}`,
        `Guest users: ${guestUsers}`,
        `Total feedbacks: ${feedbacks.length}`,
        `Most appreciated feature: ${appFeedbacks[0] ? appFeedbacks[0].name : "N/A"} (${appFeedbacks[0] ? appFeedbacks[0].average : 0}⭐)`
    ];
    doc.setFontSize(12);
    insights.forEach((i, idx) => {
        doc.text(`• ${i}`, margin, currentY);
        currentY += 7;
    });

    // === SAVE PDF ===
    doc.save(`TourKita_Full_Report_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
