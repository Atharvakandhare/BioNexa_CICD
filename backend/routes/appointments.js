const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { verifyToken } = require('../middleware/auth');

// Get user's appointments
router.get('/', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.uid })
      .populate('doctor', 'name specialization image')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: {
        upcoming: appointments.filter(a => new Date(a.date) >= new Date() && a.status === 'scheduled'),
        previous: appointments.filter(a => new Date(a.date) < new Date() || a.status !== 'scheduled')
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book new appointment
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log("Received appointment request:", req.body);

    // Find doctor by numeric ID
    const doctorId = parseInt(req.body.doctorId);
    console.log("Looking for doctor with ID:", doctorId);

    const doctor = await Doctor.findOne({ id: doctorId });
    console.log("Found doctor:", doctor);

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: `Doctor not found with ID: ${doctorId}`
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      user: req.user.uid,
      doctorId: doctorId,  // Use the numeric ID
      date: new Date(req.body.date),
      time: req.body.time,
      type: req.body.type,
      symptoms: req.body.symptoms,
      status: 'scheduled'
    });

    // Save appointment
    await appointment.save();
    
    // Populate doctor details
    const populatedAppointment = await appointment.populate('doctor');

    console.log("Created appointment:", populatedAppointment);

    res.status(201).json({ 
      success: true, 
      data: populatedAppointment 
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Error booking appointment"
    });
  }
});

// Cancel appointment
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if the appointment belongs to the user
    if (appointment.user !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if the appointment can be cancelled
    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed or already cancelled appointment'
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Populate doctor details before sending response
    await appointment.populate('doctor');

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling appointment'
    });
  }
});

module.exports = router;
