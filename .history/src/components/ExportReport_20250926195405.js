import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Exports Feedback & User data to PDF and Excel
 * @param {Array} feedbackReport - output of getFeedbackReport()
 * @param {Array} users - filtered users list
 * @param {string} filter - Monthly / Quarterly / Yearly
 * @param {number|string} year - selected year
 */
export const exportReport = (feedbackReport, users, filter, year) => {
    if (!feedbackReport || !users) return;

    // ---------------- PDF Export ----------------
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Analysis & Report - ${filter} ${year}`, 14, 15);

    // --- Feedback Report ---
    feedbackReport.forEach((r, i) => {
        const startY = 25 + i * 60;
        doc.setFontSize(12);
        doc.text(`${r.period} (${filter}) - Total Feedbacks: ${r.count} - Average Rating: ${r.average}`, 14, startY);

        const bodyData = [];
        const maxLength = Math.max(r.top.length, r.low.length);
        for (let j = 0; j < maxLength; j++) {
            bodyData.push([
                r.top[j]?.loc || '',
                r.top[j]?.avg || '',
                r.low[j]?.loc || '',
                r.low[j]?.avg || ''
            ]);
        }

        autoTable(doc, {
            startY: startY + 10,
            head: [['Top Locations', 'Average', 'Lowest Locations', 'Average']],
            body: bodyData
        });
    });

    // --- User Report ---
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

    let lastY = doc.lastAutoTable?.finalY || 25 + feedbackReport.length * 60 + 10;

    doc.setFontSize(14);
    doc.text('User Demographics', 14, lastY + 10);

    autoTable(doc, {
        startY: lastY + 15,
        head: [['Category', 'Count']],
        body: [
            ...Object.entries(genderMap).map(([k, v]) => [`Gender: ${k}`, v]),
            ...Object.entries(userTypeMap).map(([k, v]) => [`User Type: ${k}`, v]),
            ...Object.entries(ageMap).map(([k, v]) => [`Age Group: ${k}`, v])
        ]
    });

    doc.save(`Full_Report_${filter}_${year}.pdf`);

    // ---------------- Excel Export ----------------
    const feedbackExcel = feedbackReport.map(r => ({
        Period: r.period,
        'Feedback Count': r.count,
        'Average Rating': r.average,
        'Top Locations': r.top.map(t => `${t.loc}(${t.avg})`).join(', '),
        'Lowest Locations': r.low.map(t => `${t.loc}(${t.avg})`).join(', ')
    }));

    const userExcel = [
        ...Object.entries(genderMap).map(([k, v]) => ({ Category: `Gender: ${k}`, Count: v })),
        ...Object.entries(userTypeMap).map(([k, v]) => ({ Category: `User Type: ${k}`, Count: v })),
        ...Object.entries(ageMap).map(([k, v]) => ({ Category: `Age Group: ${k}`, Count: v }))
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(feedbackExcel);
    XLSX.utils.book_append_sheet(wb, ws1, 'Feedback Report');

    const ws2 = XLSX.utils.json_to_sheet(userExcel);
    XLSX.utils.book_append_sheet(wb, ws2, 'User Report');

    XLSX.writeFile(wb, `Full_Report_${filter}_${year}.xlsx`);
};
