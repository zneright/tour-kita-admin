import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';


const ExportButtons = ({ users }) => {
    const PASSWORD = '1234'; // your desired password

    const handleExport = async () => {
        // PDF
        const pdf = new jsPDF();
        pdf.setFontSize(14);
        pdf.text("User Management Report", 14, 15);
        pdf.setFontSize(10);
        pdf.text(`Date Retrieved: ${new Date().toLocaleString()}`, 14, 22);

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
        pdf.autoTable({ head: [tableColumn], body: tableRows, startY: 28, theme: 'striped', styles: { fontSize: 9 } });
        const pdfBlob = pdf.output('blob');

        // Excel
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
        const excelBlob = new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // ZIP + password
        const zip = new JSZip();
        zip.file("UserManagement.pdf", pdfBlob);
        zip.file("UserManagement.xlsx", excelBlob);
        zip.generateAsync({ type: "blob", compression: "DEFLATE", password: PASSWORD })
            .then((content) => saveAs(content, `UserManagement_${Date.now()}.zip`));
    };

    return (
        <div style={{ marginBottom: "10px" }}>
            <button onClick={handleExport}>Export PDF + Excel (Password Protected)</button>
        </div>
    );
};

export default ExportButtons;
