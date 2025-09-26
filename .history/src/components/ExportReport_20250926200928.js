import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';

const RATINGS = {
    good: 4,
    neutral: 3,
    bad: 2
};

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#E91E63', '#9C27B0'];

// Helper: calculate average
const calcAverage = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

// Helper: calculate percentage change
const calcChange = (current, previous) => {
    if (previous === 0) return current ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
};

// Helper: categorize ratings
const categorizeRatings = (ratings) => {
    const counts = { good: 0, neutral: 0, bad: 0 };
    ratings.forEach(r => {
        if (r >= 4) counts.good++;
        else if (r === 3) counts.neutral++;
        else counts.bad++;
    });
    return counts;
};

// Generate feedback insights per location/feature
const generateFeedbackInsights = (feedbacks, key) => {
    const map = {};
    feedbacks.forEach(f => {
        const k = f[key] || 'N/A';
        if (!map[k]) map[k] = [];
        map[k].push(f.rating);
    });

    return Object.entries(map).map(([name, ratings]) => {
        const avg = calcAverage(ratings);
        const counts = categorizeRatings(ratings);
        const top = Math.max(...ratings);
        const low = Math.min(...ratings);
        const concerns = ratings.filter(r => r < 3).length;
        return { name, avg, total: ratings.length, counts, top, low, concerns };
    }).sort((a, b) => b.avg - a.avg);
};

// Group feedbacks by period
const groupFeedbackByPeriod = (feedbacks, periodType, year) => {
    const groups = {};

    feedbacks.forEach(fb => {
        const date = moment(fb.createdAt);
        if (!date.isValid()) return;

        let key = '';
        switch (periodType) {
            case 'Weekly': {
                const week = date.isoWeek();
                key = `Week ${week}`;
                break;
            }
            case 'Monthly':
                if (date.year() === year) key = date.format('MMM');
                break;
            case 'Quarterly': {
                const q = date.month() <= 2 ? 'Q1' : date.month() <= 5 ? 'Q2' : date.month() <= 8 ? 'Q3' : 'Q4';
                if (date.year() === year) key = q;
                break;
            }
            case 'Yearly':
                key = date.year().toString();
                break;
        }
        if (!key) return;
        if (!groups[key]) groups[key] = [];
        groups[key].push(fb);
    });

    return groups;
};

export const exportReport = (feedbacks, users, period = 'Monthly', selectedYear = moment().year()) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    let y = 40;

    // --- HEADER ---
    doc.setFontSize(18);
    doc.text('TourKita Analysis Report', 40, y); y += 25;
    doc.setFontSize(12);
    doc.text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 40, y); y += 30;

    // --- SUMMARY CARDS ---
    const avgRating = calcAverage(feedbacks.map(f => f.rating));
    const totalUsers = users.length;
    const guestUsers = users.filter(u => u.userType === 'guest').length;
    const totalFeedbacks = feedbacks.length;

    const topLocation = generateFeedbackInsights(feedbacks, 'location')[0] || { name: 'N/A', avg: 0 };

    doc.setFontSize(14);
    doc.text(`Average Rating: ${avgRating}`, 40, y); y += 20;
    doc.text(`Total Users: ${totalUsers}`, 40, y); y += 20;
    doc.text(`Guest Users: ${guestUsers}`, 40, y); y += 20;
    doc.text(`Top Destination: ${topLocation.name} (${topLocation.avg})`, 40, y); y += 20;
    doc.text(`Total Feedbacks: ${totalFeedbacks}`, 40, y); y += 30;

    // --- FEEDBACK REPORTS ---
    const grouped = groupFeedbackByPeriod(feedbacks, period, selectedYear);

    doc.setFontSize(16);
    doc.text(`${period} Feedback Reports`, 40, y); y += 20;

    Object.entries(grouped).forEach(([p, fbs]) => {
        doc.setFontSize(14);
        doc.text(`${p} Feedbacks`, 40, y); y += 15;

        const insights = generateFeedbackInsights(fbs, 'location');
        const tableData = insights.map(d => [
            d.name,
            d.total,
            d.avg,
            d.counts.good,
            d.counts.neutral,
            d.counts.bad,
            `${d.top} / ${d.low}`,
            d.concerns
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Name', 'Total', 'Avg', 'Good', 'Neutral', 'Bad', 'Top/Low', 'Concerns']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 }
        });
        y = doc.lastAutoTable.finalY + 20;
        if (y > 700) { doc.addPage(); y = 40; }
    });

    // --- USERS REPORT ---
    doc.setFontSize(16);
    doc.text('User Reports', 40, y); y += 20;

    const userData = users.map(u => [
        u.name || 'N/A',
        u.age || 'N/A',
        u.gender || 'N/A',
        u.userType || 'N/A',
        u.registeredDate ? moment(u.registeredDate).format('YYYY-MM-DD') : 'N/A'
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Name', 'Age', 'Gender', 'User Type', 'Registered']],
        body: userData,
        theme: 'grid',
        styles: { fontSize: 10 }
    });

    doc.save(`TourKita_Report_${moment().format('YYYYMMDD_HHmmss')}.pdf`);

    // --- EXCEL ---
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
        ['Average Rating', avgRating],
        ['Total Users', totalUsers],
        ['Guest Users', guestUsers],
        ['Top Destination', `${topLocation.name} (${topLocation.avg})`],
        ['Total Feedbacks', totalFeedbacks]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Overview');

    // Feedback sheets
    Object.entries(grouped).forEach(([p, fbs]) => {
        const insights = generateFeedbackInsights(fbs, 'location');
        const wsData = [
            ['Name', 'Total', 'Avg', 'Good', 'Neutral', 'Bad', 'Top/Low', 'Concerns'],
            ...insights.map(d => [d.name, d.total, d.avg, d.counts.good, d.counts.neutral, d.counts.bad, `${d.top}/${d.low}`, d.concerns])
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), `${p} Feedback`);
    });

    // Users sheet
    const wsUsers = [
        ['Name', 'Age', 'Gender', 'User Type', 'Registered'],
        ...users.map(u => [u.name, u.age, u.gender, u.userType, u.registeredDate ? moment(u.registeredDate).format('YYYY-MM-DD') : 'N/A'])
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsUsers), 'Users');

    XLSX.writeFile(wb, `TourKita_Report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
};
