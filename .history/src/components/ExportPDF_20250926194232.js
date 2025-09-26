import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

const exportPDF = async () => {
    const doc = new jsPDF('p', 'pt', 'a4');

    // 1. Capture top cards
    const cards = document.querySelector('.cards-container');
    if (cards) {
        const canvas = await html2canvas(cards);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, 20, 550, canvas.height * 550 / canvas.width);
    }

    // Add some spacing
    let currentHeight = 20 + (cards ? (cards.offsetHeight * 550 / cards.offsetWidth) + 20 : 100);

    // 2. Feedback Overview
    const feedbackSection = document.querySelector('.chart-container:nth-of-type(1)');
    if (feedbackSection) {
        const canvas = await html2canvas(feedbackSection);
        const imgData = canvas.toDataURL('image/png');
        doc.addPage();
        doc.addImage(imgData, 'PNG', 20, 20, 550, canvas.height * 550 / canvas.width);
        currentHeight = 20 + canvas.height * 550 / canvas.width;
    }

    // 3. Capture charts
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(async (chart, idx) => {
        const canvas = await html2canvas(chart);
        const imgData = canvas.toDataURL('image/png');
        if (idx !== 0) doc.addPage(); // Add page for each chart
        doc.addImage(imgData, 'PNG', 20, 20, 550, canvas.height * 550 / canvas.width);
    });

    // 4. Optional: Add tables using autoTable
    // autoTable(doc, { head: [['Location', 'Avg Rating', 'Count']], body: locationFeedbacks.map(f => [f.name, f.average, f.count]) });

    doc.save(`AnalysisReport_${moment().format('YYYYMMDD_HHmmss')}.pdf`);
};
