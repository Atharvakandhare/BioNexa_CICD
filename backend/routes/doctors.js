const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { verifyToken } = require('../middleware/auth');

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get doctors by specialization
router.get('/specialization/:specialization', async (req, res) => {
  try {
    const doctors = await Doctor.find({ specialization: req.params.specialization });
    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get available slots for a doctor
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const availableSlots = doctor.availableDates
      .find(d => d.date.toISOString().split('T')[0] === date)
      ?.slots.filter(slot => !slot.isBooked) || [];

    res.json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update doctor's available slots
router.patch('/:id/available-slots', verifyToken, async (req, res) => {
  try {
    const { date, time, isBooked } = req.body;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const dateIndex = doctor.availableDates.findIndex(
      d => d.date.toISOString().split('T')[0] === date
    );

    if (dateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Date not found'
      });
    }

    const slotIndex = doctor.availableDates[dateIndex].slots.findIndex(
      s => s.time === time
    );

    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    doctor.availableDates[dateIndex].slots[slotIndex].isBooked = isBooked;
    await doctor.save();

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 