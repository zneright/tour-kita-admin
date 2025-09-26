import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

const ExportButtons = ({ users }) => {

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleString();

        doc.setFontSize(14);
        doc.text("User Management Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date Retrieved: ${date}`, 14, 22);

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
            head: [tableColumn],
            body: tableRows,
            startY: 28,
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
    };

    // TourKita-themed buttons
    const buttonStyle = {
        padding: '10px 20px',
        marginRight: '10px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: 'white',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s'
    };

    const pdfButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#ff6f3c', // TourKita orange
        boxShadow: '0px 4px 6px rgba(0,0,0,0.2)'
    };

    const excelButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#3c91e6', // TourKita blue
        boxShadow: '0px 4px 6px rgba(0,0,0,0.2)'
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            <button
                onClick={handleExportPDF}
                style={pdfButtonStyle}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e65c1f'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ff6f3c'}
            >
                <FaFilePdf /> Export PDF
            </button>

            <button
                onClick={handleExportExcel}
                style={excelButtonStyle}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3277c0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3c91e6'}
            >
                <FaFileExcel /> Export Excel
            </button>
        </div>
    );
};

export default ExportButtons;
