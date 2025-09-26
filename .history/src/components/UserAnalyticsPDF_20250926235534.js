// UserAnalyticsPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateUserAnalyticsPDF = (users) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita User Demographics & Analytics", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 10;

    // === Basic Stats ===
    const totalUsers = users.length;
    const userTypeCounts = {};
    const genderCounts = {};
    const ageBuckets = {};
    const emails = {};
    const profileImageCount = users.filter(u => u.profileImage).length;

    users.forEach(u => {
        // User Type
        const type = u.userType || "Other";
        userTypeCounts[type] = (userTypeCounts[type] || 0) + 1;

        // Gender
        const gender = u.gender || "Prefer Not to Say";
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;

        // Age buckets
        const age = u.age || 0;
        const group = age >= 90 ? "90+" : `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
        ageBuckets[group] = (ageBuckets[group] || 0) + 1;

        // Email domain
        const domain = u.email?.split("@")[1] || "N/A";
        emails[domain] = (emails[domain] || 0) + 1;
    });

    // === Basic Info Table ===
    doc.setFontSize(14);
    doc.text("Basic User Stats", margin, currentY);
    currentY += 5;

    autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: [
            ["Total Users", totalUsers],
            ["Users with Profile Image", profileImageCount],
        ],
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === User Type Distribution ===
    doc.setFontSize(14);
    doc.text("User Type Distribution", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["User Type", "Count"]],
        body: Object.entries(userTypeCounts).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Gender Distribution ===
    doc.setFontSize(14);
    doc.text("Gender Distribution", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["Gender", "Count"]],
        body: Object.entries(genderCounts).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Age Distribution ===
    doc.setFontSize(14);
    doc.text("Age Distribution", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["Age Range", "Count"]],
        body: Object.entries(ageBuckets).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Email Domain Analytics ===
    doc.setFontSize(14);
    doc.text("Email Domain Analytics", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["Domain", "User Count"]],
        body: Object.entries(emails).map(([k, v]) => [k, v]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === User Signup Timeline Analysis ===
    doc.setFontSize(14);
    doc.text("User Signup Timeline Analysis", margin, currentY);
    currentY += 5;

    // Group by Year -> Month -> Week -> Day
    const timeline = {};
    users.forEach(u => {
        const date = moment(u.createdAt);
        const year = date.format("YYYY");
        const month = date.format("MMMM");
        const week = date.isoWeek();
        const day = date.format("YYYY-MM-DD");

        if (!timeline[year]) timeline[year] = {};
        if (!timeline[year][month]) timeline[year][month] = {};
        if (!timeline[year][month][week]) timeline[year][month][week] = {};
        if (!timeline[year][month][week][day]) timeline[year][month][week][day] = 0;

        timeline[year][month][week][day]++;
    });

    const timelineRows = [];
    Object.entries(timeline).forEach(([year, months]) => {
        Object.entries(months).forEach(([month, weeks]) => {
            Object.entries(weeks).forEach(([week, days]) => {
                Object.entries(days).forEach(([day, count]) => {
                    timelineRows.push([year, month, week, day, count]);
                });
            });
        });
    });

    autoTable(doc, {
        startY: currentY,
        head: [["Year", "Month", "Week", "Day", "New Users"]],
        body: timelineRows,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === SAVE PDF ===
    doc.save(`TourKita_User_Analytics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
