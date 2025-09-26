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

    // === CARDS ===
    const averageRating = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : 0;
    const guestCount = users.filter(u => u.userType === 'guest').length;

    // Compute top rated location and lowest rated
    const locationMap = {};
    const featureMap = {};
    feedbacks.forEach(f => {
        if (f.location) {
            if (!locationMap[f.location]) locationMap[f.location] = [];
            locationMap[f.location].push(f.rating);
        }
        if (f.feature) {
            if (!featureMap[f.feature]) featureMap[f.feature] = [];
            featureMap[f.feature].push(f.rating);
        }
    });
    const generateDemographicsTable = (periodType) => {
        // group users by period
        const grouped = {};
        users.forEach(u => {
            const date = u.registeredDate ? moment(u.registeredDate.toDate?.() || u.registeredDate) : moment();
            let key;
            switch (periodType) {
                case 'Yearly': key = date.format('YYYY'); break;
                case 'Quarterly': key = `Q${Math.ceil((date.month() + 1) / 3)} ${date.year()}`; break;
                case 'Monthly': key = date.format('MMM YYYY'); break;
                case 'Weekly':
                    const startOfWeek = date.clone().startOf('week'); // Sunday or Monday
                    const endOfWeek = date.clone().endOf('week');
                    key = `${startOfWeek.format('MMM D')}-${endOfWeek.format('D YYYY')}`;
                    break;

                case 'Daily': key = date.format('YYYY-MM-DD'); break;
                default: key = 'N/A';
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(u);
        });

        // prepare table body
        return Object.entries(grouped).map(([k, users]) => {
            const total = users.length;
            const male = users.filter(u => u.gender?.toLowerCase() === 'male').length;
            const female = users.filter(u => u.gender?.toLowerCase() === 'female').length;
            const other = total - male - female;

            // age groups
            const ageGroups = {};
            users.forEach(u => {
                if (u.age != null) {
                    const rangeStart = Math.floor(u.age / 10) * 10;
                    const group = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
                    ageGroups[group] = (ageGroups[group] || 0) + 1;
                }
            });

            return [
                k,
                total,
                male,
                female,
                other,
                ...Object.values(ageGroups)
            ];
        });
    };

    const avgBy = (map) => {
        const res = [];
        Object.entries(map).forEach(([k, v]) => {
            const avg = v.reduce((a, b) => a + b, 0) / v.length;
            res.push({ name: k, avg, count: v.length });
        });
        res.sort((a, b) => b.avg - a.avg);
        return res;
    };

    const topLocation = avgBy(locationMap)[0] || { name: 'N/A', avg: 0 };
    const lowLocation = avgBy(locationMap).slice(-1)[0] || { name: 'N/A', avg: 0 };
    const topFeature = avgBy(featureMap)[0] || { name: 'N/A', avg: 0 };
    const lowFeature = avgBy(featureMap).slice(-1)[0] || { name: 'N/A', avg: 0 };

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
        doc.setFontSize(10);
        doc.text(c.title, x + 2, yy + 6);
        doc.setFontSize(13);
        doc.text(c.value.toString(), x + 2, yy + 13);
    });
    // Move y below the last card
    const cardRows = Math.ceil(cards.length / 3);
    y += 22 * cardRows + 5; // 22 per row + 5 margin


    // === HELPER: generate period tables ===
    const periods = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];
    periods.forEach(periodType => {
    y += 5;
    doc.setFontSize(12);
    doc.text(`${periodType} Feedback Summary`, 14, y);
    y += 2;

    const feedbackTableBody = generateFeedbackTable(periodType);
    autoTable(doc, {
        startY: y,
        head: [['Period', 'Total Feedback', 'Avg Rating', 'Positive %', 'Neutral %', 'Negative %', 'Urgent Cases']],
        body: feedbackTableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9, cellPadding: 2 },
    });
    y = doc.lastAutoTable.finalY + 5;

    doc.setFontSize(12);
    doc.text(`${periodType} User Demographics`, 14, y);
    y += 2;

    const demographicsBody = generateDemographicsTable(periodType);
    autoTable(doc, {
        startY: y,
        head: [['Period', 'Total', 'Male', 'Female', 'Other', 'Age Groups...']],
        body: demographicsBody,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] },
        styles: { fontSize: 9, cellPadding: 2 },
    });
    y = doc.lastAutoTable.finalY + 5;

    if (y > 250) { doc.addPage(); y = 20; }
});


        // Grouping
        const grouped = {};
        feedbacks.forEach(f => {
            const date = f.timestamp ? moment(f.timestamp.toDate?.() || f.timestamp) : moment();
            let key;
            switch (periodType) {
                case 'Yearly': key = date.format('YYYY'); break;
                case 'Quarterly': key = `Q${Math.ceil((date.month() + 1) / 3)} ${date.year()}`; break;
                case 'Monthly': key = date.format('MMM YYYY'); break;
                case 'Weekly':
                    const startOfWeek = date.clone().startOf('week'); // Sunday or Monday
                    const endOfWeek = date.clone().endOf('week');
                    key = `${startOfWeek.format('MMM D')}-${endOfWeek.format('D YYYY')}`;
                    break;

                case 'Daily': key = date.format('YYYY-MM-DD'); break;
                default: key = 'N/A';
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(f);
        });

        const tableBody = Object.entries(grouped).map(([k, v]) => {
            const ratings = v.map(f => f.rating);
            const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
            const pos = ratings.filter(r => r >= 4).length;
            const neu = ratings.filter(r => r == 3).length;
            const neg = ratings.filter(r => r <= 2).length;
            const posPerc = ratings.length ? ((pos / ratings.length) * 100).toFixed(1) : '0';
            const neuPerc = ratings.length ? ((neu / ratings.length) * 100).toFixed(1) : '0';
            const negPerc = ratings.length ? ((neg / ratings.length) * 100).toFixed(1) : '0';

            // check urgent (3 consecutive lows)
            let urgentCount = 0, consecutive = 0;
            ratings.forEach(r => {
                if (r <= 2) { consecutive += 1; if (consecutive >= 3) urgentCount += 1; } else consecutive = 0;
            });

            return [
                k,
                v.length,
                avg.toFixed(1),
                `${((pos / ratings.length) * 100).toFixed(1)}%`,
                `${((neu / ratings.length) * 100).toFixed(1)}%`,
                `${((neg / ratings.length) * 100).toFixed(1)}%`,
                urgentCount
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total Feedback', 'Avg Rating', 'Positive %', 'Neutral %', 'Negative %', 'Urgent Cases']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9, cellPadding: 2 },
        });
        y = doc.lastAutoTable.finalY + 5;

        if (y > 250) { doc.addPage(); y = 20; } // new page if near bottom
    });

    doc.save(`TourKita_Full_Report_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
