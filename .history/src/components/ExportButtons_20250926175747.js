import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ExportButtons = ({ users, formatTimestamp }) => {

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();
        doc.setFontSize(14);
        doc.text("User Management Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 22);

        const tableColumn = [
            "User ID", "Email", "Name", "Age", "Gender",
            "Contact Number", "Status", "Active Status", "User Type", "Registered Date"
        ];

        const tableRows = users.map((user) => [
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

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'striped',
            styles: { fontSize: 9 }
        });

        doc.save(`user_management_${new Date().getTime()}.pdf`);
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
            <button onClick={handleExportPDF} className="export-btn">Export PDF</button>
            <button onClick={handleExportExcel} className="export-btn">Export Excel</button>
        </div>
    );
};

export default ExportButtons;
