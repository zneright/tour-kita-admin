// UserAnalyticsPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

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

    // === Feature Ratings ===
    const featureRatings = {};
    feedbacks.forEach(f => {
        if (f.feedbackType === 'App Feedback' && typeof f.rating === 'number') {
            const key = f.feature || "N/A";
            if (!featureRatings[key]) featureRatings[key] = [];
            featureRatings[key].push(f.rating);
        }
    });

    // Top Feature
    let topFeature = null, topAvg = 0;
    Object.entries(featureRatings).forEach(([feature, ratings]) => {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        if (avg > topAvg) {
            topAvg = avg;
            topFeature = feature;
        }
    });

    // === Cards Stats ===
    autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: [
            ["Average Rating", averageRating.toFixed(1)],
            ["Total Users", totalUsers],
            ["Guest Users", guestUsers],
            ["Top Destination", topRatedLocation ? `${topRatedLocation.name} (${topRatedLocation.rating.toFixed(1)})` : "N/A"],
            ["Top Feature", topFeature ? `${topFeature} (${(topAvg * 20).toFixed(1)}%)` : "N/A"],
        ],
        margin: { left: margin, right: margin },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // === LOW RATINGS ALERTS ===
    doc.setFontSize(14);
    doc.text("MOST URGENT ALERTS (<2.5)", margin, currentY);
    currentY += 5;

    const urgent = [];
    const checkLow = (ratings, threshold = 2.5) => ratings.some(r => r < threshold);
    Object.entries(featureRatings).forEach(([f, ratings]) => {
        if (checkLow(ratings)) urgent.push(`Feature: ${f}`);
    });

    const locationRatings = {};
    feedbacks.forEach(f => {
        if (f.feedbackType === 'Location Feedback' && typeof f.rating === 'number') {
            const loc = f.location || "N/A";
            if (!locationRatings[loc]) locationRatings[loc] = [];
            locationRatings[loc].push(f.rating);
        }
    });
    Object.entries(locationRatings).forEach(([l, ratings]) => {
        if (checkLow(ratings)) urgent.push(`Location: ${l}`);
    });

    if (urgent.length === 0) {
        doc.text("None", margin, currentY);
        currentY += 6;
    } else {
        urgent.forEach(u => {
            doc.text(`• ${u}`, margin, currentY);
            currentY += 6;
        });
    }

    // === TOP LOW FEATURE & LOCATION ===
    const getLowTop = (ratingsMap) => {
        let result = {};
        const periods = [
            { label: "Last Month", start: moment().subtract(1, 'month').startOf('month'), end: moment().subtract(1, 'month').endOf('month') },
            { label: "Last Week", start: moment().subtract(1, 'week').startOf('week'), end: moment().subtract(1, 'week').endOf('week') },
            { label: "Yesterday", start: moment().subtract(1, 'day').startOf('day'), end: moment().subtract(1, 'day').endOf('day') },
        ];

        periods.forEach(p => {
            let top = null, lowestAvg = 5;
            Object.entries(ratingsMap).forEach(([k, ratings]) => {
                const filtered = ratings.filter(r => {
                    const fbDate = feedbacks.find(fb => (fb.feature === k || fb.location === k) && fb.rating === r)?.createdAt;
                    return fbDate && moment(fbDate).isBetween(p.start, p.end, null, '[]');
                });
                if (filtered.length === 0) return;
                const avg = filtered.reduce((sum, r) => sum + r, 0) / filtered.length;
                if (avg < lowestAvg) {
                    lowestAvg = avg;
                    top = k;
                }
            });
            result[p.label] = top ? `${top} (${lowestAvg.toFixed(1)})` : "None";
        });

        return result;
    };

    const lowFeature = getLowTop(featureRatings);
    const lowLocation = getLowTop(locationRatings);

    doc.setFontSize(14);
    doc.text("TOP LOW FEATURE & LOCATION", margin, currentY);
    currentY += 5;

    Object.keys(lowFeature).forEach(period => {
        doc.setFontSize(12);
        doc.text(`${period}: Feature: ${lowFeature[period]}, Location: ${lowLocation[period]}`, margin, currentY);
        currentY += 6;
    });

    // === SAVE PDF ===
    doc.save(`TourKita_User_Analytics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
