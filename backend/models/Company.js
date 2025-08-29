const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: String,
    website: String
  },
  logo: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxStudents: {
    type: Number,
    default: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
companySchema.index({ name: 1 });
companySchema.index({ 'address.coordinates': '2dsphere' });
companySchema.index({ admin: 1 });

// Virtual for total active sessions
companySchema.virtual('activeSessions').get(function() {
  // This will be populated when needed
  return [];
});

// Virtual for total registered students
companySchema.virtual('totalStudents').get(function() {
  // This will be populated when needed
  return 0;
});

module.exports = mongoose.model('Company', companySchema);
