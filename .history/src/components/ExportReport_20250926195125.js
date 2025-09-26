import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportReport = (report, filter, year) => {
    if (!report || report.length === 0) return;

    // --- PDF Export ---
    const doc = new jsPDF();
    report.forEach((r, i) => {
        const startY = 20 + i * 50;
        doc.text(`${r.period} - Total Feedbacks: ${r.count} - Average: ${r.average}`, 14, startY);

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
            head: [['Top Locations', 'Average', 'Low Locations', 'Average']],
            body: bodyData
        });
    });

    doc.save(`Feedback_Report_${filter}_${year}.pdf`);

    // --- Excel Export ---
    const excelData = report.map(r => ({
        Period: r.period,
        'Feedback Count': r.count,
        'Average Rating': r.average,
        'Top Locations': r.top.map(t => `${t.loc}(${t.avg})`).join(', '),
        'Lowest Locations': r.low.map(t => `${t.loc}(${t.avg})`).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Feedback_Report_${filter}_${year}.xlsx`);
};
