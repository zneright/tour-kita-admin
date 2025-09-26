import React from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';

const ExportPDFButton = ({ users }) => {
    const PDF_PASSWORD = '1234';

    const handleExportPDF = async () => {
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        // Header
        const date = new Date().toLocaleString();
        page.drawText("User Management Report", { x: 50, y: 770, size: 18, font, color: rgb(0, 0, 0) });
        page.drawText(`Date Retrieved: ${date}`, { x: 50, y: 750, size: 12, font });

        // Table simulation
        let y = 730;
        const tableHeaders = ["No", "ID", "Email", "Name", "Age", "Gender", "Status", "Active", "Type", "Reg Date"];
        page.drawText(tableHeaders.join(" | "), { x: 50, y, size: 10, font });
        y -= 15;

        users.forEach((user, index) => {
            const row = [
                index + 1,
                user.id,
                user.email || '—',
                user.name || '—',
                user.age || 'N/A',
                user.gender || '—',
                user.status,
                user.activestatus ? 'Online' : 'Offline',
                user.userType || '—',
                user.registeredDate || 'N/A'
            ];
            page.drawText(row.join(" | "), { x: 50, y, size: 10, font });
            y -= 15;
            if (y < 50) {
                page = pdfDoc.addPage([600, 800]); // ⚠️ reassigning 'const page' in your earlier code
                y = 770;
            }

        });

        // Save PDF with encryption
        const pdfBytes = await pdfDoc.save({
            passwords: {
                userPassword: PDF_PASSWORD,
                ownerPassword: PDF_PASSWORD
            }
        });

        saveAs(new Blob([pdfBytes], { type: 'application/pdf' }), `user_management_${Date.now()}.pdf`);
    };

    return <button onClick={handleExportPDF}>Export PDF (Encrypted)</button>;
};

export default ExportPDFButton;
