// ReportPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, 14, 22);

    let y = 30;

    // === CARDS ===
    const averageRating = feedbacks.length ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : 0;
    const guestCount = users.filter(u => u.userType === 'guest').length;

    const cards = [
        { title: "Average Rating", value: averageRating },
        { title: "Registered Users", value: users.length },
        { title: "Guest Users", value: guestCount },
    ];

    cards.forEach((c, i) => {
        doc.setFillColor(230, 230, 230);
        const w = 60, h = 18;
        const x = 14 + (i % 3) * 65;
        const yy = y + Math.floor(i / 3) * 22;
        doc.rect(x, yy, w, h, 'F');
        doc.setFontSize(10);
        doc.text(c.title, x + 2, yy + 6);
        doc.setFontSize(13);
        doc.text(c.value.toString(), x + 2, yy + 13);
    });
    y += Math.ceil(cards.length / 3) * 22 + 5;

    // === HELPER: generate demographics table per period ===
    const generateDemographicsTable = (periodType) => {
        const grouped = {};
        users.forEach(u => {
            const date = u.registeredDate ? moment(u.registeredDate.toDate?.() || u.registeredDate) : moment();
            let key;
            switch (periodType) {
                case 'Yearly': key = date.format('YYYY'); break;
                case 'Quarterly': key = `Q${Math.ceil((date.month() + 1) / 3)} ${date.year()}`; break;
                case 'Monthly': key = date.format('MMM YYYY'); break;
                case 'Weekly':
                    const startOfWeek = date.clone().startOf('week');
                    const endOfWeek = date.clone().endOf('week');
                    key = `${startOfWeek.format('MMM D')}-${endOfWeek.format('D YYYY')}`; break;
                case 'Daily': key = date.format('YYYY-MM-DD'); break;
                default: key = 'N/A';
            }
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(u);
        });

        return Object.entries(grouped).map(([k, users]) => {
            const total = users.length;
            const male = users.filter(u => u.gender?.toLowerCase() === 'male').length;
            const female = users.filter(u => u.gender?.toLowerCase() === 'female').length;
            const other = total - male - female;

            const ageGroups = {};
            users.forEach(u => {
                if (u.age != null) {
                    const rangeStart = Math.floor(u.age / 10) * 10;
                    const group = u.age >= 90 ? '90+' : `${rangeStart}-${rangeStart + 9}`;
                    ageGroups[group] = (ageGroups[group] || 0) + 1;
                }
            });

            return [
                k,
                total,
                male,
                female,
                other,
                ...Object.values(ageGroups)
            ];
        });
    };

    // === PERIODS FOR DEMOGRAPHICS TABLES ===
    const periods = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];
    periods.forEach(periodType => {
        y += 5;
        doc.setFontSize(12);
        doc.text(`${periodType} User Demographics`, 14, y);
        y += 2;

        const tableBody = generateDemographicsTable(periodType);

        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total', 'Male', 'Female', 'Other', 'Age Groups...']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 9, cellPadding: 2 },
        });
        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }
    });

    doc.save(`TourKita_UserDemographics_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
