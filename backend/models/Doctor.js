const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  expertise: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  education: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  patients: {
    type: Number,
    required: true
  },
  availableDates: [{
    type: Date,
    required: true
  }],
  availableSlots: [{
    type: String,
    required: true
  }],
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on id to ensure uniqueness
doctorSchema.index({ id: 1 }, { unique: true });

// Pre-save middleware to set _id equal to id
doctorSchema.pre('save', function(next) {
  if (this.isNew) {
    this._id = this.id;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema); 