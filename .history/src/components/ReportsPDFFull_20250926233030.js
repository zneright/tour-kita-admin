// ReportPDFFull.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

export const generateFullReportPDF = ({ users, feedbacks }) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 30;

    // === HEADER ===
    doc.setFontSize(18);
    doc.text("TourKita Full Analysis Report", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Generated: ${moment().format("YYYY-MM-DD HH:mm")}`, 14, 22);

    // === HELPERS ===
    const calculateAverage = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

    const groupByPeriod = (items, periodType, dateField) => {
        const grouped = {};
        items.forEach(item => {
            const date = item[dateField] ? moment(item[dateField].toDate?.() || item[dateField]) : moment();
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
            grouped[key].push(item);
        });
        return grouped;
    };

    const calculatePeriodChange = (groupedData) => {
        const keys = Object.keys(groupedData).sort();
        const changes = {};
        for (let i = 1; i < keys.length; i++) {
            const prev = groupedData[keys[i - 1]].length;
            const curr = groupedData[keys[i]].length;
            changes[keys[i]] = prev ? (((curr - prev) / prev) * 100).toFixed(1) : '0';
        }
        return changes;
    };

    const generateUserTable = (users, periodType) => {
        const grouped = groupByPeriod(users, periodType, 'registeredDate');
        const changes = calculatePeriodChange(grouped);
        const periods = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

        return periods.map(([period, uList]) => {
            const total = uList.length;

            // Gender
            const genders = {};
            uList.forEach(u => {
                const g = u.gender?.toLowerCase() || 'other';
                genders[g] = (genders[g] || 0) + 1;
            });

            // User Type
            const userTypes = {};
            uList.forEach(u => {
                const type = u.userType?.toLowerCase() || 'other';
                userTypes[type] = (userTypes[type] || 0) + 1;
            });

            // Age Groups
            const ageGroups = {};
            uList.forEach(u => {
                if (u.age != null) {
                    const start = Math.floor(u.age / 10) * 10;
                    const group = u.age >= 90 ? '90+' : `${start}-${start + 9}`;
                    ageGroups[group] = (ageGroups[group] || 0) + 1;
                }
            });

            const change = changes[period] ? `${changes[period]}%` : '-';
            return [
                period,
                total,
                ...Object.values(genders),
                ...Object.values(userTypes),
                ...Object.values(ageGroups),
                change
            ];
        });
    };

    const generateFeedbackTable = (feedbacks, periodType) => {
        const grouped = groupByPeriod(feedbacks, periodType, 'timestamp');
        const changes = calculatePeriodChange(grouped);
        const keys = Object.keys(grouped).sort();

        return keys.map(period => {
            const fList = grouped[period];
            const avg = calculateAverage(fList.map(f => f.rating));

            // Urgent cases: 3 consecutive low ratings
            let urgent = 0, consecutive = 0;
            fList.forEach(f => {
                if (f.rating <= 2) consecutive++;
                else consecutive = 0;
                if (consecutive >= 3) { urgent++; consecutive = 0; }
            });

            const change = changes[period] ? `${changes[period]}%` : '-';
            return [period, fList.length, avg, urgent, change];
        });
    };

    // === CARDS ===
    const averageRating = calculateAverage(feedbacks.map(f => f.rating));
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
        doc.setFontSize(10); doc.text(c.title, x + 2, yy + 6);
        doc.setFontSize(13); doc.text(c.value.toString(), x + 2, yy + 13);
    });
    y += Math.ceil(cards.length / 3) * 22 + 5;

    // === PERIODIC REPORTS ===
    const periods = ['Yearly', 'Quarterly', 'Monthly', 'Weekly', 'Daily'];

    periods.forEach(periodType => {
        // USER REGISTRATION TRENDS
        doc.setFontSize(12);
        doc.text(`${periodType} User Registration Trends`, 14, y);
        y += 2;

        const userTable = generateUserTable(users, periodType);
        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total', 'Gender', 'User Type', 'Age Group', 'Change %']],
            body: userTable,
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] },
            styles: { fontSize: 9, cellPadding: 2 },
        });
        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }

        // FEEDBACK TRENDS
        doc.setFontSize(12);
        doc.text(`${periodType} Feedback Summary`, 14, y);
        y += 2;

        const feedbackTable = generateFeedbackTable(feedbacks, periodType);
        autoTable(doc, {
            startY: y,
            head: [['Period', 'Total Feedback', 'Avg Rating', 'Urgent Cases', 'Change %']],
            body: feedbackTable,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 9, cellPadding: 2 },
        });
        y = doc.lastAutoTable.finalY + 5;
        if (y > 250) { doc.addPage(); y = 20; }
    });

    // === SAVE PDF ===
    doc.save(`TourKita_Full_Report_${moment().format("YYYYMMDD_HHmm")}.pdf`);
};
