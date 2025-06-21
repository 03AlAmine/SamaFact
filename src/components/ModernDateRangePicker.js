import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import '../css/custom-datepicker.css';

const ModernDateRangePicker = ({ dateRange, setDateRange }) => {
  return (
    <div className="modern-date-range-picker">
      <div className="date-picker-group">
        <FaCalendarAlt className="calendar-icon" />
        <DatePicker
          selected={dateRange.from}
          onChange={(date) => setDateRange({ ...dateRange, from: date })}
          selectsStart
          startDate={dateRange.from}
          endDate={dateRange.to}
          placeholderText="Date de début"
          className="date-picker-input"
          dateFormat="dd/MM/yyyy"
          isClearable
          clearButtonClassName="date-clear-button"
          calendarClassName="custom-calendar"
          popperClassName="custom-popper"
        />
      </div>
      
      <div className="date-separator">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12H16M16 12L13 9M16 12L13 15" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="date-picker-group">
        <FaCalendarAlt className="calendar-icon" />
        <DatePicker
          selected={dateRange.to}
          onChange={(date) => setDateRange({ ...dateRange, to: date })}
          selectsEnd
          startDate={dateRange.from}
          endDate={dateRange.to}
          minDate={dateRange.from}
          placeholderText="Date de fin"
          className="date-picker-input"
          dateFormat="dd/MM/yyyy"
          isClearable
          clearButtonClassName="date-clear-button"
          calendarClassName="custom-calendar"
          popperClassName="custom-popper"
        />
      </div>
      
      {(dateRange.from || dateRange.to) && (
        <button 
          onClick={() => setDateRange({ from: null, to: null })}
          className="clear-date-range-btn"
          aria-label="Effacer la sélection"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default ModernDateRangePicker;