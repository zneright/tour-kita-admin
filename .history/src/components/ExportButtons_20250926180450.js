import React from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportButtons = ({ users }) => {
    const PDF_PASSWORD = '1234';
    const EXCEL_PASSWORD = '1234';

    const handleExportPDF = async () => {
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]); // allow reassignment

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const date = new Date().toLocaleString();
        page.drawText('User Management Report', { x: 50, y: 770, size: 18, font, color: rgb(0, 0, 0) });
        page.drawText(`Date Retrieved: ${date}`, { x: 50, y: 750, size: 12, font });

        let y = 730;
        users.forEach((user, idx) => {
            const line = `${idx + 1}. ${user.name || '—'} | ${user.email || '—'} | ${user.age || 'N/A'} | ${user.gender || '—'} | ${user.status} | ${user.activestatus ? 'Online' : 'Offline'} | ${user.userType || '—'} | ${user.registeredDate || 'N/A'}`;
            page.drawText(line, { x: 50, y, size: 10, font });
            y -= 15;
            if (y < 50) {
                page = pdfDoc.addPage([600, 800]);
                y = 770;
            }
        });

        // Encrypt PDF
        const pdfBytes = await pdfDoc.save({ passwords: { userPassword: PDF_PASSWORD, ownerPassword: PDF_PASSWORD } });
        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `user_management_${new Date().getTime()}.pdf`);
    };

    const handleExportExcel = () => {
        const data = users.map(user => ({
            "User ID": user.id,
            "Email": user.email || '—',
            "Name": user.name || '—',
            "Age": user.age || 'N/A',
            "Gender": user.gender || '—',
            "Contact Number": user.contactNumber || '—',
            "Status": user.status,
            "Active Status": user.activestatus ? 'Online' : 'Offline',
            "User Type": user.userType || '—',
            "Registered Date": user.registeredDate || 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

        XLSX.writeFile(workbook, `user_management_${new Date().getTime()}.xlsx`);
    };

    return (
        <div style={{ marginBottom: "10px" }}>
            <button onClick={handleExportPDF} className="export-btn">Export PDF (Password)</button>
            <button onClick={handleExportExcel} className="export-btn">Export Excel</button>
        </div>
    );
};

export default ExportButtons;
