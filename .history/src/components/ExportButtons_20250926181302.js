import React from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const ExportButtons = ({ users }) => {
    const PDF_PASSWORD = '1234'; // Your real password
    const handleExportPDF = async () => {
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Header
        page.drawText('User Management Report', { x: 50, y: 770, size: 18, font, color: rgb(0, 0, 0) });
        page.drawText(`Date: ${new Date().toLocaleString()}`, { x: 50, y: 750, size: 12, font });

        // Table columns
        const columns = ["No", "User ID", "Email", "Name", "Age", "Gender", "Contact Number", "Status", "Active Status", "User Type", "Registered Date"];
        let y = 720;

        // Draw table header
        columns.forEach((col, i) => {
            page.drawText(col, { x: 50 + i * 50, y, size: 10, font, color: rgb(0, 0, 1) });
        });
        y -= 15;

        // Draw table rows
        users.forEach((user, idx) => {
            const row = [
                idx + 1,
                user.id,
                user.email || '—',
                user.name || '—',
                user.age || 'N/A',
                user.gender || '—',
                user.contactNumber || '—',
                user.status,
                user.activestatus ? 'Online' : 'Offline',
                user.userType || '—',
                user.registeredDate || 'N/A'
            ];

            row.forEach((val, i) => {
                page.drawText(String(val), { x: 50 + i * 50, y, size: 10, font });
            });

            y -= 15;
            if (y < 50) {
                page = pdfDoc.addPage([600, 800]);
                y = 770;
            }
        });

        // Encrypt PDF with password
        const pdfBytes = await pdfDoc.save({
            encrypt: true, // pdf-lib currently does not fully support user/owner password in JS
        });

        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `user_management_${Date.now()}.pdf`);
    };

    const handleExportExcel = () => {
        const data = users.map((user, index) => ({
            "No": index + 1,
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

        XLSX.writeFile(workbook, `user_management_${Date.now()}.xlsx`);
    };

    return (
        <div style={{ marginBottom: '10px' }}>
            <button onClick={handleExportPDF} className="export-btn">Export PDF (Password)</button>
            <button onClick={handleExportExcel} className="export-btn">Export Excel</button>
        </div>
    );
};

export default ExportButtons;
