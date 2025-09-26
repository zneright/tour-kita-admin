// ReportPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, 14, 22);

    let y = 30;

    // === HELPERS ===
    const calculateAverage = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

    const groupByPeriod = (items, periodType, dateField) => {
        const grouped = {};
        items.forEach(item => {
            const date = item[dateField] ? moment(item[dateField].toDate?.() || item[dateField]) : moment();
            let key;
            switch (periodType) {
                case 'Yearly': key = date.format('YYYY'); break;
                case 'Quarterly': key = `Q${Math.ceil((date.month() + 1) / 3)} ${date.year()}`; break;
                case 'Monthly': key = date.format('MMM YYYY'); break;
                case 'Weekly':
                    const startOfWeek = date.clone().startOf('week');
                    const endOfWeek = date.clone().endOf('week');
                    key = `${startOfWeek.format('MMM D')}-${endOfWeek.format('D YYYY')}`; break;
                case 'Daily': key = date.format('YYYY-MM-DD'); break;
                default: key = 'N/A';
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });
        return grouped;
    };

    const avgByMap = (map) => {
        const arr = Object.entries(map).map(([k, v]) => ({ name: k, avg: v.reduce((a, b) => a + b, 0) / v.length, count: v.length }));
        arr.sort((a, b) => b.avg - a.avg);
        return arr;
    };

    const generateUserDemographicsTable = (users, periodType) => {
        const grouped = groupByPeriod(users, periodType, 'registeredDate');
        const periods = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

        return periods.map(([k, users]) => {
            const total = users.length;

            // Count genders dynamically
            const genders = {};
            users.forEach(u => {
                const g = u.gender?.toLowerCase() || 'other';
                genders[g] = (genders[g] || 0) + 1;
            });

            // Age groups
            const ageGroups = {};
            users.forEach(u => {
                if (u.age != null) {
                    const start = Math.floor(u.age / 10) * 10;
                    const group = u.age >= 90 ? '90+' : `${start}-${start + 9}`;
                    ageGroups[group] = (ageGroups[group] || 0) + 1;
                }
            });

            return [k, total, ...Object.values(genders), ...Object.values(ageGroups)];
        });
    };

    const calculatePeriodChange = (groupedData) => {
        const keys = Object.keys(groupedData).sort();
        const changes = {};
        for (let i = 1; i < keys.length; i++) {
            const prev = groupedData[keys[i - 1]].length;
            const curr = groupedData[keys[i]].length;
            changes[keys[i]] = prev ? (((curr - prev) / prev) * 100).toFixed(1) : '0';
        }
        return changes;
    };

    // === CARDS ===
    const averageRating = calculateAverage(feedbacks.map(f => f.rating));
    const guestCount = users.filter(u => u.userType === 'guest').length;

    const locationMap = {};
    const featureMap = {};
    feedbacks.forEach(f => {
        if (f.location) locationMap[f.location] = locationMap[f.location] ? [...locationMap[f.location], f.rating] : [f.rating];
        if (f.feature) featureMap[f.feature] = featureMap[f.feature] ? [...featureMap[f.feature], f.rating] : [f.rating];
    });

    const topLocation = avgByMap(locationMap)[0] || { name: 'N/A', avg: 0 };
    const lowLocation = avgByMap(locationMap).slice(-1)[0] || { name: 'N/A', avg: 0 };
    const topFeature = avgByMap(featureMap)[0] || { name: 'N/A', avg: 0 };
    const lowFeature = avgByMap(featureMap).slice(-1)[0] || { name: 'N/A', avg: 0 };

    const cards = [
        { title: "Average Rating", value: averageRating },
        { title: "Registered Users", value: users.length },
        { title: "Guest Users", value: guestCount },
        { title: "Top Location", value: `${topLocation.name} (${topLocation.avg.toFixed(1)})` },
        { title: "Lowest Location", value: `${lowLocation.name} (${lowLocation.avg.toFixed(1)})` },
        { title: "Top Feature", value: `${topFeature.name} (${topFeature.avg.toFixed(1)})` },
        { title: "Lowest Feature", value: `${lowFeature.name} (${lowFeature.avg.toFixed(1)})` },
    ];

    cards.forEach((c, i) => {
        doc.setFillColor(230, 230, 230);
        const w = 60, h = 18;
        const x = 14 + (i % 3) * 65;
        const yy = y + Math.floor(i / 3) * 22;
        doc.rect(x, yy, w, h, 'F');
        doc.setFontSize(10); doc.text(c.title, x + 2, yy + 6);
        doc.setFontSize(13); doc.text(c.value.toString(), x + 2, yy + 13);
    });
    y += Math.ceil(cards.length / 3) * 22 + 5;

    // === PERIODIC REPORTS ===
    const periods = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];

    periods.forEach(periodType => {
        // === USER REGISTRATION TRENDS ===
        const groupedUsers = groupByPeriod(users, periodType, 'registeredDate');
        const changes = calculatePeriodChange(groupedUsers);

        doc.setFontSize(12);
        doc.text(`${periodType} User Registration Trends`, 14, y);
        y += 2;

        const userTable = generateUserDemographicsTable(users, periodType);
        const userTableWithChange = userTable.map(row => {
            const period = row[0];
            const change = changes[period] ? `${changes[period]}%` : '-';
            return [...row, change];
        });

        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total', 'Genders...', 'Age Groups...', 'Change %']],
            body: userTableWithChange,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 9, cellPadding: 2 },
        });

        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }

        // === FEEDBACK TRENDS ===
        doc.setFontSize(12);
        doc.text(`${periodType} Feedback Summary`, 14, y);
        y += 2;

        const groupedFeedback = groupByPeriod(feedbacks, periodType, 'timestamp');
        const feedbackKeys = Object.keys(groupedFeedback).sort();
        const feedbackChanges = calculatePeriodChange(groupedFeedback);

        const feedbackTableBody = feedbackKeys.map(k => {
            const v = groupedFeedback[k];
            const ratings = v.map(f => f.rating);
            const avg = calculateAverage(ratings);
            const pos = ratings.filter(r => r >= 4).length;
            const neu = ratings.filter(r => r === 3).length;
            const neg = ratings.filter(r => r <= 2).length;

            // Urgent cases
            let urgentCount = 0, consecutive = 0;
            ratings.forEach(r => {
                if (r <= 2) consecutive += 1;
                else consecutive = 0;
                if (consecutive >= 3) { urgentCount += 1; consecutive = 0; }
            });

            const change = feedbackChanges[k] ? `${feedbackChanges[k]}%` : '-';
            return [
                k, v.length, avg,
                `${((pos / ratings.length) * 100).toFixed(1)}%`,
                `${((neu / ratings.length) * 100).toFixed(1)}%`,
                `${((neg / ratings.length) * 100).toFixed(1)}%`,
                urgentCount, change
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total Feedback', 'Avg Rating', 'Positive %', 'Neutral %', 'Negative %', 'Urgent Cases', 'Change %']],
            body: feedbackTableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9, cellPadding: 2 },
        });

        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }
    });

    // === SAVE PDF ===
    doc.save(`TourKita_Full_Report_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
