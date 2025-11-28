import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faComments, faUserMd, faUser, faCalendarAlt, faPrescription, faSignOutAlt, faPlus, faSearch, faStethoscope, faNotesMedical, faSpinner, faArrowLeft, faExclamationTriangle, faStar, faGraduationCap, faBriefcase, faUsers, faClock, faTimesCircle, faCalendarDay, faClock as faClockSolid, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { analyzeSymptoms } from '../services/aiService';
import { doctors } from '../data/doctors';
import './Dashboard.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [appointmentSubTab, setAppointmentSubTab] = useState('upcoming');
  const [isBooking, setIsBooking] = useState(false);
  const [searchType, setSearchType] = useState(null);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [appointments, setAppointments] = useState({
    upcoming: [],
    previous: []
  });
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const specializations = [
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Pulmonology',
    'Urology'
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        const response = await fetch('http://localhost:5000/api/appointments', {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          // Sort appointments based on date and status
          const now = new Date();
          const allAppointments = data.data.upcoming.concat(data.data.previous);
          
          const sortedAppointments = {
            upcoming: allAppointments.filter(app => {
              const appointmentDate = new Date(app.date);
              return appointmentDate >= now && app.status === 'scheduled';
            }).sort((a, b) => new Date(a.date) - new Date(b.date)),
            
            previous: allAppointments.filter(app => {
              const appointmentDate = new Date(app.date);
              return appointmentDate < now || app.status === 'cancelled' || app.status === 'completed';
            }).sort((a, b) => new Date(b.date) - new Date(a.date))
          };

          setAppointments(sortedAppointments);
        } else {
          console.error('Error fetching appointments:', data.message);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleBookAppointment = () => {
    setIsBooking(true);
  };

  const handleSearchBySpecialization = () => {
    setSearchType('specialization');
  };

  const handleSearchBySymptoms = () => {
    setSearchType('symptoms');
  };

  const handleBackToAppointments = () => {
    setIsBooking(false);
    setSearchType(null);
    setSelectedSpecialization('');
    setSymptoms('');
    setAnalysisResult(null);
  };

  const handleBackToSearchOptions = () => {
    setSearchType(null);
    setSelectedSpecialization('');
    setSymptoms('');
    setAnalysisResult(null);
  };

  const handleSpecializationSearch = () => {
    if (!selectedSpecialization) return;
    setSearchType('doctors-list');
  };

  const handleSymptomsSearch = () => {
    if (!analysisResult) return;
    setSearchType('doctors-list');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel appointment');
      }

      // Update the appointments state
      setAppointments(prev => {
        const cancelledAppointment = prev.upcoming.find(app => app._id === appointmentId);
        if (cancelledAppointment) {
          cancelledAppointment.status = 'cancelled';
          return {
            upcoming: prev.upcoming.filter(app => app._id !== appointmentId),
            previous: [cancelledAppointment, ...prev.previous]
          };
        }
        return prev;
      });

      toast.success('Appointment cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.message || 'Failed to cancel appointment. Please try again.');
    }
  };

  const handleBookDoctor = async () => {
    if (!selectedDoctor) {
      toast.warning("Please select a doctor first.");
      return;
    }
    if (!selectedDate) {
      toast.warning("Please select an appointment date.");
      return;
    }
    if (!selectedSlot) {
      toast.warning("Please select a time slot.");
      return;
    }

    try {
      console.log("Selected Doctor:", selectedDoctor);

      const appointmentData = {
        doctorId: selectedDoctor.id,
        date: selectedDate,
        time: selectedSlot,
        type: 'consultation',
        symptoms: selectedDoctor.expertise || selectedDoctor.specialization
      };

      console.log("Appointment Data:", appointmentData);

      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(appointmentData)
      });

      const responseData = await response.json();
      console.log("Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to book appointment");
      }

      // Update appointments state with the new appointment
      setAppointments(prev => ({
        upcoming: [...(prev.upcoming || []), {
          ...responseData.data,
          doctor: {
            name: selectedDoctor.name,
            specialization: selectedDoctor.expertise || selectedDoctor.specialization,
            experience: selectedDoctor.experience,
            rating: selectedDoctor.rating,
            image: selectedDoctor.image
          }
        }],
        previous: prev.previous || []
      }));

      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setSearchType(null);
      setIsBooking(false);

      toast.success("Appointment booked successfully!");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment. Please try again.");
    }
  };

  const handleSymptomsAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    if (!symptoms.trim()) {
      setError('Please describe your symptoms before analyzing');
      setIsAnalyzing(false);
      return;
    }

    try {
      const analysis = await analyzeSymptoms(symptoms);
      setAnalysisResult({
        specializations: analysis.specializations,
        explanations: analysis.explanations,
        urgency: analysis.urgency,
        symptoms: symptoms
      });
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      setError(error.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const features = [
    {
      icon: faVideo,
      title: 'Video Consultations',
      description: 'Connect with healthcare professionals through secure video calls'
    },
    {
      icon: faComments,
      title: 'Instant Messaging',
      description: 'Real-time chat with your healthcare providers'
    },
    {
      icon: faCalendarAlt,
      title: 'Appointment Scheduling',
      description: 'Book and manage your medical appointments easily'
    },
    {
      icon: faPrescription,
      title: 'Digital Prescriptions',
      description: 'Access and manage your prescriptions digitally for convenience'
    }
  ];

  return (
    <div className="dashboard">
      <ToastContainer position="top-right" autoClose={5000} />
      <aside className="dashboard-sidebar">
        <div className="user-profile">
          <FontAwesomeIcon icon={faUser} className="user-icon" />
          <h3>Welcome, {user?.displayName || 'User'}!</h3>
        </div>
        <nav className="dashboard-nav">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FontAwesomeIcon icon={faUserMd} />
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>Appointments</span>
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'overview' ? (
          <>
        <header className="dashboard-header">
          <h1>BioNexa Healthcare Platform</h1>
          <p>Your gateway to modern healthcare solutions</p>
        </header>

          <section className="features-grid">
            {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <FontAwesomeIcon icon={feature.icon} className="feature-icon" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
          </section>
          </>
        ) : (
          <section className="appointments-section">
            <div className="appointments-container">
              {!isBooking ? (
                <>
                  <div className="appointments-header">
                    <div className="appointment-tabs">
                      <button 
                        className={`appointment-tab ${appointmentSubTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setAppointmentSubTab('upcoming')}
                      >
                        Upcoming Appointments
                      </button>
                      <button 
                        className={`appointment-tab ${appointmentSubTab === 'previous' ? 'active' : ''}`}
                        onClick={() => setAppointmentSubTab('previous')}
                      >
                        Previous Appointments
                      </button>
                    </div>
                    <button className="book-appointment-btn" onClick={handleBookAppointment}>
                      <FontAwesomeIcon icon={faPlus} />
                      Book New Appointment
                    </button>
                  </div>
                  <div className="appointments-list">
                    {appointmentSubTab === 'upcoming' ? (
                      appointments.upcoming && appointments.upcoming.length > 0 ? (
                        appointments.upcoming.map((appointment) => (
                          <div key={appointment._id} className="appointment-card">
                            <div className="appointment-doctor">
                              <img 
                                src={appointment.doctor?.image || 'https://via.placeholder.com/60'} 
                                alt={appointment.doctor?.name} 
                                className="doctor-image"
                              />
                              <div className="doctor-info">
                                <h3>{appointment.doctor?.name || 'Doctor Name'}</h3>
                                <p className="doctor-specialization">{appointment.doctor?.specialization}</p>
                              </div>
                            </div>
                            
                            <div className="appointment-details">
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faCalendarDay} className="icon" />
                                <div>
                                  <div className="label">Date</div>
                                  <div className="value">{new Date(appointment.date).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faClockSolid} className="icon" />
                                <div>
                                  <div className="label">Time</div>
                                  <div className="value">{appointment.time}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faStethoscope} className="icon" />
                                <div>
                                  <div className="label">Type</div>
                                  <div className="value">{appointment.type}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faNotesMedical} className="icon" />
                                <div>
                                  <div className="label">Symptoms</div>
                                  <div className="value">{appointment.symptoms}</div>
                                </div>
                              </div>
                            </div>

                            <div className="appointment-actions">
                              <button 
                                className="cancel-btn"
                                onClick={() => handleCancelAppointment(appointment._id)}
                              >
                                <FontAwesomeIcon icon={faTimesCircle} />
                                Cancel Appointment
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-appointments">
                          <p>No upcoming appointments</p>
                        </div>
                      )
                    ) : (
                      appointments.previous && appointments.previous.length > 0 ? (
                        appointments.previous.map((appointment) => (
                          <div key={appointment._id} className="appointment-card">
                            <div className="appointment-doctor">
                              <img 
                                src={appointment.doctor?.image || 'https://via.placeholder.com/60'} 
                                alt={appointment.doctor?.name} 
                                className="doctor-image"
                              />
                              <div className="doctor-info">
                                <h3>{appointment.doctor?.name || 'Doctor Name'}</h3>
                                <p className="doctor-specialization">{appointment.doctor?.specialization}</p>
                              </div>
                            </div>
                            
                            <div className="appointment-details">
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faCalendarDay} className="icon" />
                                <div>
                                  <div className="label">Date</div>
                                  <div className="value">{new Date(appointment.date).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faClockSolid} className="icon" />
                                <div>
                                  <div className="label">Time</div>
                                  <div className="value">{appointment.time}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faStethoscope} className="icon" />
                                <div>
                                  <div className="label">Type</div>
                                  <div className="value">{appointment.type}</div>
                                </div>
                              </div>
                              <div className="detail-item">
                                <FontAwesomeIcon icon={faNotesMedical} className="icon" />
                                <div>
                                  <div className="label">Status</div>
                                  <div className={`appointment-status status-${appointment.status.toLowerCase()}`}>
                                    {appointment.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-appointments">
                          <p>No previous appointments</p>
                        </div>
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="booking-section">
                  <div className="booking-header">
                    <button className="back-button" onClick={handleBackToAppointments}>
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <h2>Book New Appointment</h2>
                  </div>
                  {!searchType ? (
                    <div className="doctor-selection-cards">
                      <div className="selection-card">
                        <FontAwesomeIcon icon={faStethoscope} className="selection-icon" />
                        <h3>Search by Specialization</h3>
                        <p>Find doctors based on their medical specialization and expertise</p>
                        <button className="search-button" onClick={() => setSearchType('specialization')}>
                          <FontAwesomeIcon icon={faSearch} />
                          Search Doctors
                        </button>
                      </div>
                      <div className="selection-card">
                        <FontAwesomeIcon icon={faNotesMedical} className="selection-icon" />
                        <h3>Search by Symptoms</h3>
                        <p>Describe your symptoms and let AI find the right specialist for you</p>
                        <button className="search-button" onClick={() => setSearchType('symptoms')}>
                          <FontAwesomeIcon icon={faSearch} />
                          Search Doctors
                        </button>
                      </div>
                    </div>
                  ) : searchType === 'specialization' ? (
                    <div className="search-form">
                      <div className="search-header">
                        <button className="back-button" onClick={handleBackToSearchOptions}>
                          <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h3>Select Doctor's Specialization</h3>
                      </div>
                      <div className="form-group">
                        <select 
                          className="specialization-select"
                          value={selectedSpecialization}
                          onChange={(e) => setSelectedSpecialization(e.target.value)}
                        >
                          <option value="">Choose a specialization</option>
                          {specializations.map((spec, index) => (
                            <option key={index} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        className="search-button"
                        onClick={handleSpecializationSearch}
                        disabled={!selectedSpecialization}
                      >
                        <FontAwesomeIcon icon={faSearch} />
                        Search Doctors
                      </button>
                    </div>
                  ) : searchType === 'doctors-list' ? (
                    <div className="search-form">
                      <div className="search-header">
                        <button className="back-button" onClick={handleBackToSearchOptions}>
                          <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h3>Available Doctors</h3>
                      </div>
                      <div className="doctors-grid">
                        {doctors[selectedSpecialization]?.map((doctor) => (
                          <div key={doctor.id} className="doctor-card">
                            <img src={doctor.image} alt={doctor.name} className="doctor-image" />
                            <div className="doctor-info">
                              <div className="doctor-header">
                                <h3 className="doctor-name">{doctor.name}</h3>
                                <div className="doctor-rating">
                                  <FontAwesomeIcon icon={faStar} />
                                  {doctor.rating}
                                </div>
                              </div>
                              <div className="doctor-details">
                                <div className="doctor-detail-item">
                                  <FontAwesomeIcon icon={faGraduationCap} />
                                  {doctor.education}
                                </div>
                                <div className="doctor-detail-item">
                                  <FontAwesomeIcon icon={faBriefcase} />
                                  {doctor.experience} experience
                                </div>
                                <div className="doctor-detail-item">
                                  <FontAwesomeIcon icon={faUsers} />
                                  {doctor.patients} patients treated
                                </div>
                              </div>
                              <p className="doctor-description">{doctor.description}</p>
                              <div className="available-dates">
                                <h4>Available Dates</h4>
                                <div className="date-slots">
                                  {doctor.availableDates.map((date) => (
                                    <button
                                      key={date}
                                      className={`date-slot ${selectedDate === date ? 'selected' : ''}`}
                                      onClick={() => handleDateSelect(date)}
                                    >
                                      {new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </button>
                                  ))}
                                </div>
                                {selectedDate && (
                                  <>
                                    <h4>Available Time Slots</h4>
                                    <div className="date-slots">
                                      {doctor.availableSlots.map((slot) => (
                                        <button
                                          key={slot}
                                          className={`date-slot ${selectedSlot === slot ? 'selected' : ''}`}
                                          onClick={() => handleSlotSelect(slot)}
                                        >
                                          {slot}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                              <button
                                className="book-appointment"
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  if (selectedDate && selectedSlot) {
                                    handleBookDoctor();
                                  } else {
                                    toast.warning("Please select a date and time slot first.");
                                  }
                                }}
                                disabled={!selectedDate || !selectedSlot}
                              >
                                Book Appointment
                              </button>
                            </div>
                  </div>
                ))}
              </div>
                    </div>
                  ) : (
                    <div className="search-form">
                      <div className="search-header">
                        <button className="back-button" onClick={handleBackToSearchOptions}>
                          <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        <h3>Describe Your Symptoms</h3>
                      </div>
                      {!analysisResult ? (
                        <>
                          <div className="form-group">
                            <textarea
                              className="symptoms-textarea"
                              placeholder="Please describe your symptoms in detail (e.g., fever, headache, chest pain)..."
                              value={symptoms}
                              onChange={(e) => setSymptoms(e.target.value)}
                              rows={6}
                            />
                          </div>
                          {error && <div className="error-message">{error}</div>}
                          <button 
                            className="search-button"
                            onClick={handleSymptomsAnalysis}
                            disabled={!symptoms.trim() || isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                                Analyzing Symptoms...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faSearch} />
                                Analyze Symptoms
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <div className="analysis-result">
                          <div className={`urgency-banner ${analysisResult.urgency.toLowerCase()}`}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>Urgency Level: {analysisResult.urgency}</span>
                          </div>
                          <h4>Based on your symptoms:</h4>
                          <p className="symptoms-summary">{analysisResult.symptoms}</p>
                          <h4>Recommended Specializations:</h4>
                          <div className="specialization-list">
                            {analysisResult.specializations.map((spec, index) => (
                              <div key={index} className="specialization-item">
                                <div className="specialization-content">
                                  <FontAwesomeIcon icon={faStethoscope} />
                                  <span className="specialization-name">{spec}</span>
                                  <p className="specialization-explanation">{analysisResult.explanations[spec]}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            className="search-button"
                            onClick={() => setAnalysisResult(null)}
                          >
                            Try Again
                </button>
              </div>
            )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;