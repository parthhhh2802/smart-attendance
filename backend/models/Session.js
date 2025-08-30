const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['internship', 'industrial_visit'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    name: {
      type: String,
    },
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function(v) {
            return Array.isArray(v) && v.length === 2;
          },
          message: 'Coordinates must be an array of [longitude, latitude]'
        }
      }
    },
    radius: {
      type: Number,
      default: 100, // meters
      min: 50,
      max: 1000
    }
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  qrCodes: [{
    date: {
      type: Date,
      required: true
    },
    qrData: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
    // Removed expiresAt field - QR codes are now permanent
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxStudents: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming'
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

// Index for efficient queries
sessionSchema.index({ startDate: 1, endDate: 1, status: 1 });
sessionSchema.index({ 'location.coordinates': '2dsphere' });
sessionSchema.index({ faculty: 1, company: 1 });

// Virtual for checking if session is currently active
sessionSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'active';
});

// Virtual for getting today's QR code
sessionSchema.virtual('todayQRCode').get(function() {
  if (this.type === 'internship') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.qrCodes.find(qr => {
      const qrDate = new Date(qr.date);
      qrDate.setHours(0, 0, 0, 0);
      return qrDate.getTime() === today.getTime() && qr.isActive;
    });
  } else {
    // For industrial visit, return the first QR code
    return this.qrCodes.find(qr => qr.isActive);
  }
});

// Method to generate QR codes for internship
sessionSchema.methods.generateDailyQRCodes = function() {
  if (this.type !== 'internship') return;
  
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const today = new Date();
  
  // Only generate for current and future dates
  const currentDate = new Date(Math.max(start, today));
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const qrData = JSON.stringify({
      sessionId: this._id,
      date: dateStr,
      type: 'attendance',
      timestamp: Date.now()
    });
    
    // Check if QR code already exists for this date
    const existingQR = this.qrCodes.find(qr => {
      const qrDate = new Date(qr.date);
      return qrDate.toISOString().split('T')[0] === dateStr;
    });
    
    if (!existingQR) {
      this.qrCodes.push({
        date: new Date(currentDate),
        qrData: qrData,
        isActive: true
        // Removed expiresAt - QR codes are now permanent
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
};

// Method to generate single QR code for industrial visit
sessionSchema.methods.generateIndustrialVisitQR = function() {
  if (this.type !== 'industrial_visit') return;
  
  const qrData = JSON.stringify({
    sessionId: this._id,
    date: this.startDate.toISOString().split('T')[0],
    type: 'attendance',
    timestamp: Date.now()
  });
  
  this.qrCodes = [{
    date: this.startDate,
    qrData: qrData,
    isActive: true
    // Removed expiresAt - QR codes are now permanent
  }];
};

module.exports = mongoose.model('Session', sessionSchema);
