import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import './ExportButtons.css';

const ExportButtons = ({ users }) => {

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'pt', 'a4');
        const date = new Date().toLocaleString();

        doc.setFontSize(14);
        doc.text("User Management Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 35);

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

        autoTable(doc, {
            startY: 50,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: { fontSize: 9, overflow: 'linebreak', cellPadding: 3 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            columnStyles: {
                1: { cellWidth: 60 },
                2: { cellWidth: 80 },
                3: { cellWidth: 80 },
                6: { cellWidth: 70 },
                10: { cellWidth: 70 },
            },
            didDrawCell: (data) => {
            },
            tableWidth: 'auto' 

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
        };

        return (
            <div className="export-buttons-container">
                <button onClick={handleExportPDF} className="export-btn pdf">
                    <FaFilePdf /> Export PDF
                </button>

                <button onClick={handleExportExcel} className="export-btn excel">
                    <FaFileExcel /> Export Excel
                </button>
            </div>
        );
    };

    export default ExportButtons;
