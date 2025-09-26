// ExportReport.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

/**
 * Helper: calculate percentage change
 */
const calcChange = (current, previous) => {
    if (previous === 0) return 100;
    return (((current - previous) / previous) * 100).toFixed(1);
};

/**
 * Generate insights for feedbacks per location or feature
 */
const generateFeedbackInsights = (feedbacks, groupKey) => {
    const grouped = {};
    feedbacks.forEach(fb => {
        const key = fb[groupKey] || 'N/A';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(fb.rating);
    });

    const insights = Object.entries(grouped).map(([key, ratings]) => {
        const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        const count = ratings.length;
        const top = Math.max(...ratings).toFixed(1);
        const low = Math.min(...ratings).toFixed(1);
        const concerns = ratings.filter(r => r < 3).length;
        return { key, count, avg: avg.toFixed(1), top, low, concerns };
    });

    return insights.sort((a, b) => b.avg - a.avg);
};

/**
 * Export full report
 */
export const exportReport = (feedbacks, users, options = {}) => {
    const { period = 'Monthly', selectedYear = moment().year() } = options;

    // --- 1. PDF Generation ---
    const doc = new jsPDF('p', 'pt', 'a4');
    let y = 40;

    doc.setFontSize(18);
    doc.text('TourKita Analysis Report', 40, y);
    y += 25;
    doc.setFontSize(12);
    doc.text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 40, y);
    y += 30;

    // --- Cards Summary ---
    const avgRating = feedbacks.length
        ? (feedbacks.map(f => f.rating).reduce((a, b) => a + b, 0) / feedbacks.length).toFixed(1)
        : 0;
    const totalUsers = users.length;
    const guestUsers = users.filter(u => u.userType === 'guest').length;
    const locationRatings = generateFeedbackInsights(feedbacks, 'location');
    const topLocation = locationRatings[0] ? `${locationRatings[0].key} (${locationRatings[0].avg})` : 'N/A';

    doc.setFontSize(14);
    doc.text(`Average Rating: ${avgRating}`, 40, y); y += 20;
    doc.text(`Total Users: ${totalUsers}`, 40, y); y += 20;
    doc.text(`Guest Users: ${guestUsers}`, 40, y); y += 20;
    doc.text(`Top Destination: ${topLocation}`, 40, y); y += 30;

    // --- Feedback Insights Table ---
    doc.setFontSize(16);
    doc.text('Feedback Insights', 40, y); y += 20;

    const periods = period === 'Monthly'
        ? moment.monthsShort()
        : period === 'Quarterly'
            ? ['Q1', 'Q2', 'Q3', 'Q4']
            : [selectedYear.toString()];

    periods.forEach(p => {
        const periodFeedbacks = feedbacks.filter(fb => {
            const date = moment(fb.createdAt);
            if (!date.isValid()) return false;
            if (period === 'Monthly') return date.format('MMM') === p && date.year() === selectedYear;
            if (period === 'Quarterly') {
                const q = date.month() <= 2 ? 'Q1' : date.month() <= 5 ? 'Q2' : date.month() <= 8 ? 'Q3' : 'Q4';
                return q === p && date.year() === selectedYear;
            }
            return date.year() === Number(p);
        });

        if (periodFeedbacks.length === 0) return;

        doc.setFontSize(14);
        doc.text(`${p} Feedbacks`, 40, y); y += 15;

        const data = generateFeedbackInsights(periodFeedbacks, 'location');
        const tableData = data.map(d => [
            d.key,
            d.count,
            d.avg,
            d.top,
            d.low,
            d.concerns
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Location', 'Total Feedbacks', 'Average Rating', 'Top', 'Lowest', 'Concerns']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 }
        });

        y = doc.lastAutoTable.finalY + 20;
        if (y > 700) { doc.addPage(); y = 40; }
    });

    // --- User Reports ---
    doc.setFontSize(16);
    doc.text('User Reports', 40, y); y += 20;

    const userTableData = users.map(u => [
        u.name || 'N/A',
        u.age || 'N/A',
        u.gender || 'N/A',
        u.userType || 'N/A',
        u.registeredDate ? moment(u.registeredDate).format('YYYY-MM-DD') : 'N/A'
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Name', 'Age', 'Gender', 'User Type', 'Registered Date']],
        body: userTableData,
        theme: 'grid',
        styles: { fontSize: 10 }
    });

    // Save PDF
    doc.save(`TourKita_Report_${moment().format('YYYYMMDD_HHmmss')}.pdf`);

    // --- 2. Excel Generation ---
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['Average Rating', avgRating],
        ['Total Users', totalUsers],
        ['Guest Users', guestUsers],
        ['Top Destination', topLocation]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Feedback Sheets
    periods.forEach(p => {
        const periodFeedbacks = feedbacks.filter(fb => {
            const date = moment(fb.createdAt);
            if (!date.isValid()) return false;
            if (period === 'Monthly') return date.format('MMM') === p && date.year() === selectedYear;
            if (period === 'Quarterly') {
                const q = date.month() <= 2 ? 'Q1' : date.month() <= 5 ? 'Q2' : date.month() <= 8 ? 'Q3' : 'Q4';
                return q === p && date.year() === selectedYear;
            }
            return date.year() === Number(p);
        });

        if (periodFeedbacks.length === 0) return;

        const data = generateFeedbackInsights(periodFeedbacks, 'location');
        const wsData = [
            ['Location', 'Total Feedbacks', 'Average Rating', 'Top', 'Lowest', 'Concerns'],
            ...data.map(d => [d.key, d.count, d.avg, d.top, d.low, d.concerns])
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, `${p} Feedback`);
    });

    // User Sheet
    const wsUsersData = [
        ['Name', 'Age', 'Gender', 'User Type', 'Registered Date'],
        ...users.map(u => [
            u.name || 'N/A',
            u.age || 'N/A',
            u.gender || 'N/A',
            u.userType || 'N/A',
            u.registeredDate ? moment(u.registeredDate).format('YYYY-MM-DD') : 'N/A'
        ])
    ];
    const wsUsers = XLSX.utils.aoa_to_sheet(wsUsersData);
    XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');

    XLSX.writeFile(wb, `TourKita_Report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
};
