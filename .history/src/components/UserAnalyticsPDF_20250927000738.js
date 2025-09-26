// UserAnalyticsPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0', '#9B59B6', '#F39C12'];

const drawBar = (doc, x, y, width, maxWidth, value, maxValue, color = "#3e95cd") => {
    const barWidth = (value / maxValue) * maxWidth;
    doc.setFillColor(color);
    doc.rect(x, y - 3, barWidth, 6, "F");
};

export const generateUserAnalyticsPDF = ({ users, feedbacks, filter, selectedYear, userType, averageRating, topRatedLocation }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full User Analytics", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${moment().format("MMMM Do YYYY, h:mm A")}`, pageWidth - margin, currentY, { align: "right" });
    currentY += 12;

    // === Filtered Users ===
    const filteredUsers = users.filter(u => {
        if (userType.toLowerCase() !== 'all' && u.userType.toLowerCase() !== userType.toLowerCase()) return false;
        const date = moment(u.registeredDate);
        if (!date.isValid()) return false;
        if (filter === 'Yearly') return date.year() === selectedYear;
        return true;
    });

    const totalUsers = filteredUsers.length;
    const guestUsers = filteredUsers.filter(u => u.userType === 'guest').length;

    // === Cards Stats ===
    autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: [
            ["Average Rating", averageRating.toFixed(1)],
            ["Total Users", totalUsers],
            ["Guest Users", guestUsers],
            ["Top Destination", topRatedLocation ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})` : "N/A"],
        ],
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === DISTRIBUTIONS ===
    const createDistributionTable = (title, field, colorIndex = 0) => {
        const counts = {};
        filteredUsers.forEach(u => {
            let key = u[field] || 'N/A';
            if (field === 'age') {
                const rangeStart = Math.floor(u.age / 10) * 10;
                key = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
            }
            counts[key] = (counts[key] || 0) + 1;
        });

        const maxCount = Math.max(...Object.values(counts), 1);
        doc.setFontSize(14);
        doc.text(title, margin, currentY);
        currentY += 5;

        autoTable(doc, {
            startY: currentY,
            head: [[field.charAt(0).toUpperCase() + field.slice(1), "Count", "Percentage", "Bar"]],
            body: Object.entries(counts).map(([k, v]) => [k, v, `${((v / totalUsers) * 100).toFixed(1)}%`, v]),
            didDrawCell: (data) => {
                if (data.column.index === 3 && data.cell.section === 'body') {
                    drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, maxCount, COLORS[colorIndex % COLORS.length]);
                }
            },
            margin: { left: margin, right: margin },
        });
        currentY = doc.lastAutoTable.finalY + 10;
    };

    createDistributionTable("Gender Distribution", "gender", 1);
    createDistributionTable("User Type Distribution", "userType", 2);
    createDistributionTable("Age Group Distribution", "age", 3);

    // === REGISTRATION TREND ===
    doc.setFontSize(14);
    doc.text(`Registration Trend (${filter})`, margin, currentY);
    currentY += 5;

    // Aggregate trend
    const trendCounts = {};
    filteredUsers.forEach(u => {
        const date = moment(u.registeredDate);
        let key = '';
        if (filter === 'Monthly') key = date.format('MMM');
        else if (filter === 'Quarterly') key = `Q${Math.ceil((date.month() + 1) / 3)}`;
        else key = date.year();
        trendCounts[key] = (trendCounts[key] || 0) + 1;
    });

    const trendMax = Math.max(...Object.values(trendCounts), 1);
    autoTable(doc, {
        startY: currentY,
        head: [[filter, "New Users", "Bar"]],
        body: Object.entries(trendCounts).map(([k, v]) => [k, v, v]),
        didDrawCell: (data) => {
            if (data.column.index === 2 && data.cell.section === 'body') {
                drawBar(doc, data.cell.x + 2, data.cell.y + data.cell.height / 2, 0, data.cell.width - 4, data.cell.raw, trendMax, COLORS[4]);
            }
        },
        margin: { left: margin, right: margin },
    });

    // === SAVE PDF ===
    doc.save(`TourKita_User_Analytics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
