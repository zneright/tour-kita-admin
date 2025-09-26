import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportButtons = ({ users }) => {
    const PDF_PASSWORD = '1234';  // soft reminder only
    const EXCEL_PASSWORD = '1234'; // soft reminder only

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();

        doc.setFontSize(14);
        doc.text("User Management Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 22);
        doc.text(`Password: ${PDF_PASSWORD}`, 14, 28); // Soft reminder

        const tableColumn = [
            "No", "User ID", "Email", "Name", "Age", "Gender", "Contact Number", "Status", "Active Status", "User Type", "Registered Date"
        ];

        const tableRows = users.map((user, index) => [
            index + 1,
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
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 32,
            theme: 'striped',
            styles: { fontSize: 9 }
        });

        doc.save(`user_management_${Date.now()}.pdf`);
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
        alert(`Excel Password (Soft Reminder): ${EXCEL_PASSWORD}`);
    };

    return (
        <div style={{ marginBottom: "10px" }}>
            <button onClick={handleExportPDF} className="export-btn">Export PDF (Table)</button>
            <button onClick={handleExportExcel} className="export-btn">Export Excel (Table)</button>
        </div>
    );
};

export default ExportButtons;
