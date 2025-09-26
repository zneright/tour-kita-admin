// ReportsPDFFullUserAnalytics.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

// Helper for drawing bars in table rows (mini bar chart)
const drawBar = (doc, x, y, width, maxWidth, value, maxValue, color = "#3e95cd") => {
    const barWidth = (value / maxValue) * maxWidth;
    doc.setFillColor(color);
    doc.rect(x, y - 3, barWidth, 6, "F");
};

export const generateUserAnalyticsPDF = (users) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full User Analytics & Visualization", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 12;

    // === BASIC STATS ===
    const totalUsers = users.length;
    const profileImageCount = users.filter(u => u.profileImage).length;

    const userTypeCounts = {};
    const genderCounts = {};
    const ageBuckets = {};
    const emailDomains = {};
    const signupTimeline = {};

    users.forEach(u => {
        const type = u.userType || "Other";
        userTypeCounts[type] = (userTypeCounts[type] || 0) + 1;

        const gender = u.gender || "Prefer Not to Say";
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;

        const age = u.age || 0;
        const ageGroup = age >= 90 ? "90+" : `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`;
        ageBuckets[ageGroup] = (ageBuckets[ageGroup] || 0) + 1;

        const domain = u.email?.split("@")[1] || "N/A";
        emailDomains[domain] = (emailDomains[domain] || 0) + 1;

        // Signup timeline
        const date = moment(u.createdAt);
        const year = date.format("YYYY");
        const month = date.format("MMMM");
        const week = date.isoWeek();
        const day = date.format("YYYY-MM-DD");

        if (!signupTimeline[year]) signupTimeline[year] = {};
        if (!signupTimeline[year][month]) signupTimeline[year][month] = {};
        if (!signupTimeline[year][month][week]) signupTimeline[year][month][week] = {};
        if (!signupTimeline[year][month][week][day]) signupTimeline[year][month][week][day] = 0;
        signupTimeline[year][month][week][day]++;
    });

    // === BASIC INFO TABLE ===
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

    // === USER TYPE DISTRIBUTION WITH MINI BARS ===
    doc.setFontSize(14);
    doc.text("User Type Distribution", margin, currentY);
    currentY += 5;

    const maxUserTypeCount = Math.max(...Object.values(userTypeCounts));
    autoTable(doc, {
        startY: currentY,
        head: [["User Type", "Count", "Percentage", "Bar"]],
        body: Object.entries(userTypeCounts).map(([type, count]) => {
            const percent = ((count / totalUsers) * 100).toFixed(1);
            return [type, count, `${percent}%`, count]; // 'count' will be used for bar
        }),
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, maxUserTypeCount);
            }
        },
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === GENDER DISTRIBUTION WITH MINI BARS ===
    doc.setFontSize(14);
    doc.text("Gender Distribution", margin, currentY);
    currentY += 5;

    const maxGenderCount = Math.max(...Object.values(genderCounts));
    autoTable(doc, {
        startY: currentY,
        head: [["Gender", "Count", "Percentage", "Bar"]],
        body: Object.entries(genderCounts).map(([gender, count]) => {
            const percent = ((count / totalUsers) * 100).toFixed(1);
            return [gender, count, `${percent}%`, count];
        }),
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, maxGenderCount, "#f39c12");
            }
        },
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === AGE DISTRIBUTION WITH MINI BARS ===
    doc.setFontSize(14);
    doc.text("Age Distribution", margin, currentY);
    currentY += 5;

    const maxAgeCount = Math.max(...Object.values(ageBuckets));
    autoTable(doc, {
        startY: currentY,
        head: [["Age Range", "Count", "Percentage", "Bar"]],
        body: Object.entries(ageBuckets).sort((a, b) => a[0].localeCompare(b[0])).map(([ageRange, count]) => {
            const percent = ((count / totalUsers) * 100).toFixed(1);
            return [ageRange, count, `${percent}%`, count];
        }),
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, maxAgeCount, "#27ae60");
            }
        },
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === EMAIL DOMAIN DISTRIBUTION WITH MINI BARS ===
    doc.setFontSize(14);
    doc.text("Email Domain Analytics", margin, currentY);
    currentY += 5;

    const maxDomainCount = Math.max(...Object.values(emailDomains));
    autoTable(doc, {
        startY: currentY,
        head: [["Domain", "Count", "Percentage", "Bar"]],
        body: Object.entries(emailDomains).map(([domain, count]) => {
            const percent = ((count / totalUsers) * 100).toFixed(1);
            return [domain, count, `${percent}%`, count];
        }),
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, maxDomainCount, "#8e44ad");
            }
        },
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === SIGNUP TIMELINE TABLE ===
    doc.setFontSize(14);
    doc.text("User Signup Timeline (Year → Month → Week → Day)", margin, currentY);
    currentY += 5;

    const timelineRows = [];
    Object.entries(signupTimeline).forEach(([year, months]) => {
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

    // === TREND ANALYSIS WITH PERCENTAGE CHANGE ===
    doc.setFontSize(14);
    doc.text("Weekly Signup Trend with Percentage Change", margin, currentY);
    currentY += 5;

    const weeklyTotals = {};
    Object.entries(signupTimeline).forEach(([year, months]) => {
        Object.entries(months).forEach(([month, weeks]) => {
            Object.entries(weeks).forEach(([week, days]) => {
                const total = Object.values(days).reduce((a, b) => a + b, 0);
                weeklyTotals[`${year}-W${week}`] = total;
            });
        });
    });

    const trendRows = [];
    let prev = null;
    Object.entries(weeklyTotals).forEach(([week, total]) => {
        let change = prev !== null ? (((total - prev) / prev) * 100).toFixed(1) + "%" : "N/A";
        trendRows.push([week, total, change]);
        prev = total;
    });

    autoTable(doc, {
        startY: currentY,
        head: [["Week", "New Users", "% Change"]],
        body: trendRows,
        margin: { left: margin, right: margin },
    });

    // === SAVE PDF ===
    doc.save(`TourKita_User_Full_Analytics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
