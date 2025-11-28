import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faCalendarCheck, faArrowLeft, faFilter } from '@fortawesome/free-solid-svg-icons';
import './DoctorList.css';

const DoctorList = ({ doctors, loading, onBack }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);
  if (loading) {
    return (
      <div className="doctor-list-loading">
        <div className="loading-spinner"></div>
        <p>Finding available doctors...</p>
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return null;
  }

  const handleDateFilter = (date) => {
    setSelectedDate(date);
    if (date) {
      const filtered = doctors.filter(doctor => 
        doctor.availableDates && doctor.availableDates.includes(date)
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
  };

  return (
    <div className="doctor-list-container">
      <div className="doctor-list-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3>Available Doctors</h3>
        <div className="filter-section">
          <FontAwesomeIcon icon={faFilter} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateFilter(e.target.value)}
            className="date-filter"
          />
        </div>
      </div>
      <div className="doctor-grid">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.id} className="doctor-card">
            <div className="doctor-header">
              <div className="doctor-avatar">
                {doctor.photoUrl ? (
                  <img src={doctor.photoUrl} alt={doctor.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {doctor.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="doctor-status">
                <FontAwesomeIcon 
                  icon={faCircle} 
                  className={`status-icon ${doctor.isAvailable ? 'available' : 'unavailable'}`} 
                />
                {doctor.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>
            
            <div className="doctor-info">
              <h4>{doctor.name}</h4>
              <p className="doctor-specialty">{doctor.specialty}</p>
              <p className="doctor-experience">{doctor.experience} years experience</p>
              <p className="doctor-description">{doctor.description}</p>
            </div>

            <div className="doctor-footer">
              <div className="doctor-rating">
                <span className="rating-score">{doctor.rating}</span>
                <span className="rating-count">({doctor.reviewCount} reviews)</span>
              </div>
              <button 
                className="book-appointment-btn"
                disabled={!doctor.isAvailable}
              >
                <FontAwesomeIcon icon={faCalendarCheck} />
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorList;