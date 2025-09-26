// ReportsPDFFullUserAnalytics.js
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

    // === BASIC STATS ===
    const totalUsers = users.length;
    const userTypeCounts = {};
    const genderCounts = {};
    const ageBuckets = {};
    const emailDomains = {};
    const profileImageCount = users.filter(u => u.profileImage).length;

    users.forEach(u => {
        const type = u.userType || "Other";
        userTypeCounts[type] = (userTypeCounts[type] || 0) + 1;

        const gender = u.gender || "Prefer Not to Say";
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;

        const age = u.age || 0;
        const group = age >= 90 ? "90+" : `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
        ageBuckets[group] = (ageBuckets[group] || 0) + 1;

        const domain = u.email?.split("@")[1] || "N/A";
        emailDomains[domain] = (emailDomains[domain] || 0) + 1;
    });

    // === Basic Stats Table ===
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
    const userTypeRows = Object.entries(userTypeCounts).map(([k, v]) => {
        const percent = ((v / totalUsers) * 100).toFixed(1);
        return [k, v, `${percent}%`];
    });
    autoTable(doc, {
        startY: currentY,
        head: [["User Type", "Count", "Percentage"]],
        body: userTypeRows,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Gender Distribution ===
    doc.setFontSize(14);
    doc.text("Gender Distribution", margin, currentY);
    currentY += 5;
    const genderRows = Object.entries(genderCounts).map(([k, v]) => {
        const percent = ((v / totalUsers) * 100).toFixed(1);
        return [k, v, `${percent}%`];
    });
    autoTable(doc, {
        startY: currentY,
        head: [["Gender", "Count", "Percentage"]],
        body: genderRows,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Age Distribution ===
    doc.setFontSize(14);
    doc.text("Age Distribution", margin, currentY);
    currentY += 5;
    const ageRows = Object.entries(ageBuckets).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => {
        const percent = ((v / totalUsers) * 100).toFixed(1);
        return [k, v, `${percent}%`];
    });
    autoTable(doc, {
        startY: currentY,
        head: [["Age Range", "Count", "Percentage"]],
        body: ageRows,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Email Domain Analytics ===
    doc.setFontSize(14);
    doc.text("Email Domain Analytics", margin, currentY);
    currentY += 5;
    const domainRows = Object.entries(emailDomains).map(([k, v]) => {
        const percent = ((v / totalUsers) * 100).toFixed(1);
        return [k, v, `${percent}%`];
    });
    autoTable(doc, {
        startY: currentY,
        head: [["Domain", "User Count", "Percentage"]],
        body: domainRows,
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Signup Timeline Analysis ===
    doc.setFontSize(14);
    doc.text("User Signup Timeline Analysis", margin, currentY);
    currentY += 5;

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

    // === Trend Analysis ===
    doc.setFontSize(14);
    doc.text("User Signup Trend Analysis", margin, currentY);
    currentY += 5;

    const trendRows = [];
    Object.entries(timeline).forEach(([year, months]) => {
        Object.entries(months).forEach(([month, weeks]) => {
            Object.entries(weeks).forEach(([week, days]) => {
                let weekTotal = 0;
                Object.values(days).forEach(c => weekTotal += c);
                trendRows.push([year, month, week, weekTotal]);
            });
        });
    });

    autoTable(doc, {
        startY: currentY,
        head: [["Year", "Month", "Week", "Total Users"]],
        body: trendRows,
        margin: { left: margin, right: margin },
    });

    // === SAVE PDF ===
    doc.save(`TourKita_User_Analytics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
