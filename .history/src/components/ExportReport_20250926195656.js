import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportReport = (feedbackReport, users, filter, year) => {
    if (!feedbackReport || !users) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Full Analysis Report - ${filter} ${year}`, 14, 15);

    let startY = 25;

    // ---------------- Feedback Tables ----------------
    doc.setFontSize(14);
    doc.text('Feedback Report', 14, startY);
    startY += 6;

    const addFeedbackTable = (title, data) => {
        doc.setFontSize(12);
        doc.text(title, 14, startY);
        startY += 4;

        const bodyData = data.map(d => [
            d.period,
            d.count,
            d.average,
            d.top.map(t => `${t.loc}(${t.avg})`).join(', '),
            d.low.map(t => `${t.loc}(${t.avg})`).join(', ')
        ]);

        autoTable(doc, {
            startY,
            head: [['Period', 'Total Feedbacks', 'Avg Rating', 'Top Locations', 'Lowest Locations']],
            body: bodyData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [100, 100, 100] },
        });

        startY = doc.lastAutoTable.finalY + 10;
    };

    if (filter === 'Monthly' || filter === 'Yearly') {
        // all months in one table
        addFeedbackTable(`${filter} Feedback Overview`, feedbackReport);
    } else if (filter === 'Quarterly') {
        // split per quarter
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        quarters.forEach(q => {
            const qData = feedbackReport.filter(f => q.includes(f.period));
            if (qData.length > 0) addFeedbackTable(`Quarter ${q} Feedback Overview`, qData);
        });
    }

    // ---------------- User Summary ----------------
    doc.setFontSize(14);
    doc.text('User Demographics', 14, startY);
    startY += 6;

    const genderMap = {};
    const userTypeMap = {};
    const ageMap = {};

    users.forEach(u => {
        // Gender
        const g = u.gender || 'Prefer Not to Say';
        genderMap[g] = (genderMap[g] || 0) + 1;

        // User Type
        const t = u.userType || 'Other';
        userTypeMap[t] = (userTypeMap[t] || 0) + 1;

        // Age Groups
        const rangeStart = Math.floor(u.age / 10) * 10;
        const ageGroup = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
        ageMap[ageGroup] = (ageMap[ageGroup] || 0) + 1;
    });

    const userBody = [
        ...Object.entries(genderMap).map(([k, v]) => [`Gender: ${k}`, v]),
        ...Object.entries(userTypeMap).map(([k, v]) => [`User Type: ${k}`, v]),
        ...Object.entries(ageMap).map(([k, v]) => [`Age Group: ${k}`, v])
    ];

    autoTable(doc, {
        startY,
        head: [['Category', 'Count']],
        body: userBody,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [100, 100, 100] },
    });

    // ---------------- Save PDF ----------------
    doc.save(`Full_Report_${filter}_${year}.pdf`);

    // ---------------- Excel ----------------
    const wb = XLSX.utils.book_new();

    // Feedback Sheet
    let feedbackExcel = [];
    if (filter === 'Monthly' || filter === 'Yearly') {
        feedbackExcel = feedbackReport.map(r => ({
            Period: r.period,
            'Total Feedbacks': r.count,
            'Average Rating': r.average,
            'Top Locations': r.top.map(t => `${t.loc}(${t.avg})`).join(', '),
            'Lowest Locations': r.low.map(t => `${t.loc}(${t.avg})`).join(', ')
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(feedbackExcel), 'Feedback Report');
    } else if (filter === 'Quarterly') {
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        quarters.forEach(q => {
            const qData = feedbackReport.filter(f => q.includes(f.period))
                .map(r => ({
                    Period: r.period,
                    'Total Feedbacks': r.count,
                    'Average Rating': r.average,
                    'Top Locations': r.top.map(t => `${t.loc}(${t.avg})`).join(', '),
                    'Lowest Locations': r.low.map(t => `${t.loc}(${t.avg})`).join(', ')
                }));
            if (qData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qData), `Quarter ${q}`);
        });
    }

    // User Sheet
    const userExcel = [
        ...Object.entries(genderMap).map(([k, v]) => ({ Category: `Gender: ${k}`, Count: v })),
        ...Object.entries(userTypeMap).map(([k, v]) => ({ Category: `User Type: ${k}`, Count: v })),
        ...Object.entries(ageMap).map(([k, v]) => ({ Category: `Age Group: ${k}`, Count: v })),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(userExcel), 'User Summary');

    XLSX.writeFile(wb, `Full_Report_${filter}_${year}.xlsx`);
};
