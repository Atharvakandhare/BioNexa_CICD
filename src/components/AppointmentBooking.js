import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStethoscope, faNotesMedical, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import DoctorList from './DoctorList';
import './AppointmentBooking.css';

const AppointmentBooking = ({ onBack }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const specialties = [
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Pediatrician',
    'Psychiatrist',
    'Orthopedist',
    'General Physician'
  ];

  const handleSpecialtySelect = async (specialty) => {
    setLoading(true);
    setSelectedSpecialty(specialty);
    // TODO: Fetch doctors by specialty
    setLoading(false);
  };

  const handleSymptomsSubmit = async () => {
    setLoading(true);
    // TODO: Analyze symptoms and fetch recommended doctors
    setLoading(false);
  };

  if (doctors.length > 0) {
    return <DoctorList doctors={doctors} loading={loading} onBack={() => setDoctors([])} />;
  }

  return (
    <div className="appointment-booking-container">
      <div className="booking-header">
        <div className="header-with-back">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
          <h2>Book New Appointment</h2>
        </div>
        <p>Choose how you'd like to find a doctor</p>
      </div>

      <div className="booking-options">
        <div 
          className={`booking-option ${selectedOption === 'specialty' ? 'selected' : ''}`}
          onClick={() => setSelectedOption('specialty')}
        >
          <FontAwesomeIcon icon={faStethoscope} className="option-icon" />
          <h3>Choose by Specialty</h3>
          <p>Select a medical specialty to find relevant doctors</p>
          
          {selectedOption === 'specialty' && (
            <div className="specialty-selector">
              <select
                value={selectedSpecialty}
                onChange={(e) => handleSpecialtySelect(e.target.value)}
                className="specialty-dropdown"
              >
                <option value="">Select a specialty...</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
              {selectedSpecialty && (
                <button 
                  className="submit-symptoms-btn"
                  onClick={() => setDoctors(['temp'])}
                  style={{ marginTop: '1rem' }}
                >
                  Find Doctors
                </button>
              )}
            </div>
          )}
        </div>

        <div 
          className={`booking-option ${selectedOption === 'symptoms' ? 'selected' : ''}`}
          onClick={() => setSelectedOption('symptoms')}
        >
          <FontAwesomeIcon icon={faNotesMedical} className="option-icon" />
          <h3>Find by Symptoms</h3>
          <p>Describe your symptoms and we'll match you with suitable doctors</p>
          
          {selectedOption === 'symptoms' && (
            <div className="symptoms-input">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms here..."
                rows="4"
              />
              <button 
                className="submit-symptoms-btn"
                onClick={handleSymptomsSubmit}
                disabled={!symptoms.trim()}
              >
                Find Doctors
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;