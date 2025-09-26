// ReportsPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF("p", "mm", "a4");
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

    // === Feedback Overview ===
    const locationRatings = {};
    const featureRatings = {};

    feedbacks.forEach(f => {
        if (f.location && typeof f.rating === "number") {
            if (!locationRatings[f.location]) locationRatings[f.location] = { total: 0, count: 0, ratings: [] };
            locationRatings[f.location].total += f.rating;
            locationRatings[f.location].count += 1;
            locationRatings[f.location].ratings.push({ date: f.createdAt, rating: f.rating });
        }
        if (f.feature && typeof f.rating === "number") {
            if (!featureRatings[f.feature]) featureRatings[f.feature] = { total: 0, count: 0, ratings: [] };
            featureRatings[f.feature].total += f.rating;
            featureRatings[f.feature].count += 1;
            featureRatings[f.feature].ratings.push({ date: f.createdAt, rating: f.rating });
        }
    });

    const locationFeedbacks = Object.entries(locationRatings).map(([name, data]) => ({
        name,
        average: (data.total / data.count).toFixed(1),
        count: data.count,
        ratings: data.ratings
    })).sort((a, b) => b.average - a.average);

    const appFeedbacks = Object.entries(featureRatings).map(([name, data]) => ({
        name,
        average: (data.total / data.count).toFixed(1),
        count: data.count,
        ratings: data.ratings
    })).sort((a, b) => b.average - a.average);

    // === Location Feedback Table ===
    doc.setFontSize(14);
    doc.text("Location Feedback", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["Location", "Average Rating", "Feedback Count"]],
        body: locationFeedbacks.map(l => [l.name, l.average, l.count]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === App Feature Feedback Table ===
    doc.setFontSize(14);
    doc.text("App Feature Feedback", margin, currentY);
    currentY += 5;
    autoTable(doc, {
        startY: currentY,
        head: [["Feature", "Average Rating", "Feedback Count"]],
        body: appFeedbacks.map(f => [f.name, f.average, f.count]),
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === Weekly and Daily Analysis for Locations & Features ===
    const generateTimeSeriesTable = (items, type = "location") => {
        items.forEach(item => {
            doc.setFontSize(12);
            doc.text(`${type === "location" ? "Location" : "Feature"}: ${item.name}`, margin, currentY);
            currentY += 5;

            // Group by week and day
            const weekMap = {};
            const dayMap = {};
            const sortedRatings = item.ratings
                .map(r => ({ date: r.date ? moment(r.date.toDate ? r.date.toDate() : r.date) : moment(), rating: r.rating }))
                .sort((a, b) => a.date - b.date);

            sortedRatings.forEach((r, idx) => {
                const week = r.date.isoWeek();
                const day = r.date.format("YYYY-MM-DD");

                if (!weekMap[week]) weekMap[week] = [];
                weekMap[week].push(r.rating);

                if (!dayMap[day]) dayMap[day] = [];
                dayMap[day].push(r.rating);
            });

            // Table headers
            autoTable(doc, {
                startY: currentY,
                head: [["Week", "Average Rating", "% Change"], ...Object.keys(dayMap).slice(0, 0).map(d => [d, "Avg", "% Change"])],
                body: Object.entries(weekMap).map(([wk, ratings], idx, arr) => {
                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                    let pctChange = idx === 0 ? "N/A" : (((avg - arr[idx - 1][1].reduce((s, r) => s + r, 0) / arr[idx - 1][1].length) / (arr[idx - 1][1].reduce((s, r) => s + r, 0) / arr[idx - 1][1].length)) * 100).toFixed(1) + "%");
                    return [wk, avg.toFixed(1), pctChange];
                }),
                margin: { left: margin, right: margin },
                theme: "grid",
            });
            currentY = doc.lastAutoTable.finalY + 5;

            autoTable(doc, {
                startY: currentY,
                head: [["Day", "Average Rating", "% Change"]],
                body: Object.entries(dayMap).map(([day, ratings], idx, arr) => {
                    const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                    let prevAvg = idx === 0 ? null : Object.entries(dayMap)[idx - 1][1].reduce((s, r) => s + r, 0) / Object.entries(dayMap)[idx - 1][1].length;
                    let pctChange = prevAvg == null ? "N/A" : (((avg - prevAvg) / prevAvg) * 100).toFixed(1) + "%";
                    return [day, avg.toFixed(1), pctChange];
                }),
                margin: { left: margin, right: margin },
                theme: "grid",
            });
            currentY = doc.lastAutoTable.finalY + 10;
        });
    };

    generateTimeSeriesTable(locationFeedbacks, "location");
    generateTimeSeriesTable(appFeedbacks, "feature");

    // === SAVE PDF ===
    doc.save(`TourKita_Full_Report_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
