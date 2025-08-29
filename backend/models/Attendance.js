const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present'
  },
  checkInTime: {
    type: Date,
    required: true
  },
  checkOutTime: {
    type: Date
  },
  location: {
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    address: String,
    isWithinRadius: {
      type: Boolean,
      required: true
    },
    distance: {
      type: Number, // distance from event location in meters
      required: true
    }
  },
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session.qrCodes'
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    timestamp: Date
  },
  notes: {
    type: String,
    trim: true
  },
  markedBy: {
    type: String,
    enum: ['qr_scan', 'manual', 'admin'],
    default: 'qr_scan'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
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

// Indexes for efficient queries
attendanceSchema.index({ session: 1, student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ session: 1, date: 1 });
attendanceSchema.index({ student: 1, date: 1 });
attendanceSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for duration
attendanceSchema.virtual('duration').get(function() {
  if (this.checkOutTime && this.checkInTime) {
    return this.checkOutTime.getTime() - this.checkInTime.getTime();
  }
  return null;
});

// Virtual for formatted duration
attendanceSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return null;
  
  const hours = Math.floor(this.duration / (1000 * 60 * 60));
  const minutes = Math.floor((this.duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Method to check if location is within session radius
attendanceSchema.methods.validateLocation = function(sessionLocation, sessionRadius) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = this.location.coordinates.lat * Math.PI / 180;
  const φ2 = sessionLocation.lat * Math.PI / 180;
  const Δφ = (sessionLocation.lat - this.location.coordinates.lat) * Math.PI / 180;
  const Δλ = (sessionLocation.lng - this.location.coordinates.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const distance = R * c;
  this.location.distance = distance;
  this.location.isWithinRadius = distance <= sessionRadius;
  
  return this.location.isWithinRadius;
};

// Pre-save middleware to update date if not provided
attendanceSchema.pre('save', function(next) {
  if (!this.date) {
    this.date = new Date();
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
