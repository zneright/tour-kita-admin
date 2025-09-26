// ReportPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(11);
    doc.text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, 14, y);
    y += 10;

    // === KPI INTRODUCTION TEXT ===
    const kpiText = `A Key Performance Indicator (KPI) is a measurable number that highlights key business objectives. Depending on your industry and the specific department you are interested in tracking, there are a number of KPI types your business will want to monitor. Each department will want to measure success based on specific goals and targets.

If you are a marketer, own a business, or are simply goal-oriented, chances are that you use KPI or metrics to have some kind of performance measure. People in sales could use them to measure customer retention, qualified leads, or average order value, business owners would use metrics for overall gross profit margin, financial KPIs, or employee satisfaction.

All of these examples use KPI for one thing in mind, to make better decision making.`;

    const lines = doc.splitTextToSize(kpiText, pageWidth - 28); // 14mm margin
    doc.setFontSize(12);
    doc.text(lines, 14, y);
    y += lines.length * 6 + 5;

    // === HELPERS ===
    const calculateAverage = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

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
                    key = `${startOfWeek.format('MMM D')}-${endOfWeek.format('D YYYY')}`;
                    break;
                case 'Daily': key = date.format('YYYY-MM-DD'); break;
                default: key = 'N/A';
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });
        return grouped;
    };

    const calculatePeriodChange = groupedData => {
        const keys = Object.keys(groupedData).sort();
        const changes = {};
        for (let i = 1; i < keys.length; i++) {
            const prev = groupedData[keys[i - 1]].length;
            const curr = groupedData[keys[i]].length;
            changes[keys[i]] = prev ? (((curr - prev) / prev) * 100).toFixed(1) : '0';
        }
        return changes;
    };

    const getUniqueKeys = (items, field) => {
        const keys = new Set();
        items.forEach(i => keys.add(i[field]?.toLowerCase() || 'other'));
        return Array.from(keys);
    };

    // === CARDS ===
    const averageRating = calculateAverage(feedbacks.map(f => f.rating));
    const guestCount = users.filter(u => u.userType === 'guest').length;
    const cards = [
        { title: "Average Rating", value: averageRating },
        { title: "Registered Users", value: users.length },
        { title: "Guest Users", value: guestCount },
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
        // USER REGISTRATION TRENDS
        const groupedUsers = groupByPeriod(users, periodType, 'registeredDate');
        const changes = calculatePeriodChange(groupedUsers);

        const genders = getUniqueKeys(users, 'gender');
        const userTypes = getUniqueKeys(users, 'userType');

        const userTableBody = Object.entries(groupedUsers).map(([period, userList]) => {
            const total = userList.length;

            const genderCounts = genders.map(g => userList.filter(u => (u.gender?.toLowerCase() || 'other') === g).length);
            const typeCounts = userTypes.map(t => userList.filter(u => (u.userType?.toLowerCase() || 'other') === t).length);

            const ageGroups = {};
            userList.forEach(u => {
                if (u.age != null) {
                    const start = Math.floor(u.age / 10) * 10;
                    const group = u.age >= 90 ? '90+' : `${start}-${start + 9}`;
                    ageGroups[group] = (ageGroups[group] || 0) + 1;
                }
            });

            const change = changes[period] ? `${changes[period]}%` : '-';
            return [period, total, ...genderCounts, ...typeCounts, ...Object.values(ageGroups), change];
        });

        const userTableHead = [
            'Period', 'Total',
            ...genders.map(g => g.charAt(0).toUpperCase() + g.slice(1)),
            ...userTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            'Age Groups...', 'Change %'
        ];

        doc.setFontSize(12);
        doc.text(`${periodType} User Registration Trends`, 14, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [userTableHead],
            body: userTableBody,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 9, cellPadding: 2 },
        });
        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }

        // FEEDBACKS
        const groupedFeedback = groupByPeriod(feedbacks, periodType, 'timestamp');
        const feedbackChanges = calculatePeriodChange(groupedFeedback);

        const feedbackTableBody = Object.entries(groupedFeedback).map(([period, fbList]) => {
            const avg = calculateAverage(fbList.map(f => f.rating));
            let urgent = 0, consecutive = 0;
            fbList.forEach(r => {
                if (r.rating <= 2) consecutive += 1;
                else consecutive = 0;
                if (consecutive >= 3) { urgent += 1; consecutive = 0; }
            });
            const change = feedbackChanges[period] ? `${feedbackChanges[period]}%` : '-';
            return [period, fbList.length, avg, urgent, change];
        });

        doc.setFontSize(12);
        doc.text(`${periodType} Feedback Summary`, 14, y);
        y += 2;

        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total Feedback', 'Avg Rating', 'Urgent Cases', 'Change %']],
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
