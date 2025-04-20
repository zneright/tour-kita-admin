import React from 'react';
import './DateFilter.css';

const DateFilter = ({ value, onChange }) => {
    return (
        <select className="date-filter" value={value} onChange={onChange}>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
        </select>
    );
};

export default DateFilter;
