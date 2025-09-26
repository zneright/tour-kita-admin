import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const exportPDF = () => {
    const input = document.getElementById('report-content');
    html2canvas(input, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`AnalysisReport_${new Date().toISOString().slice(0, 10)}.pdf`);
    });
};
