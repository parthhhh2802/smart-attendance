const express = require('express');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const { auth, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance/mark
// @desc    Mark attendance using QR code
// @access  Private (Student)
router.post('/mark', auth, authorize('student'), async (req, res) => {
  try {
    const { qrData, location, deviceInfo } = req.body;

    if (!qrData || !location) {
      return res.status(400).json({ message: 'QR data and location are required.' });
    }

    // Parse QR data
    let parsedQR;
    try {
      parsedQR = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code data.' });
    }

    const { sessionId, date, type } = parsedQR;

    if (type !== 'attendance') {
      return res.status(400).json({ message: 'Invalid QR code type.' });
    }

    // Find session
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if student is registered for this session
    const isRegistered = session.students.some(
      student => student.student.toString() === req.user._id.toString()
    );

    if (!isRegistered) {
      return res.status(400).json({ message: 'You are not registered for this session.' });
    }

    // Check if session is active
    if (!session.isActive) {
      return res.status(400).json({ message: 'Session is not active.' });
    }

    // Check if QR code is valid for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let validQR = null;
    if (session.type === 'internship') {
      validQR = session.qrCodes.find(qr => {
        const qrDate = new Date(qr.date);
        qrDate.setHours(0, 0, 0, 0);
        return qrDate.getTime() === today.getTime() && qr.isActive;
      });
    } else {
      // For industrial visit, check if it's today
      const sessionDate = new Date(session.startDate);
      sessionDate.setHours(0, 0, 0, 0);
      if (sessionDate.getTime() === today.getTime()) {
        validQR = session.qrCodes.find(qr => qr.isActive);
      }
    }

    if (!validQR) {
      return res.status(400).json({ message: 'QR code is not valid for today.' });
    }

    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      session: sessionId,
      student: req.user._id,
      date: today
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for today.' });
    }

    // Validate location
    const isWithinRadius = validateLocation(
      location.coordinates,
      session.location.coordinates,
      session.location.radius
    );

    // Create attendance record
    const attendance = new Attendance({
      session: sessionId,
      student: req.user._id,
      date: today,
      checkInTime: new Date(),
      location: {
        coordinates: location.coordinates,
        address: location.address,
        isWithinRadius,
        distance: calculateDistance(
          location.coordinates,
          session.location.coordinates
        )
      },
      qrCode: validQR._id,
      deviceInfo: {
        userAgent: deviceInfo?.userAgent || req.headers['user-agent'],
        platform: deviceInfo?.platform || 'unknown',
        timestamp: new Date()
      }
    });

    await attendance.save();

    // Populate references
    await attendance.populate(['session', 'student']);

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
      isWithinRadius
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error during attendance marking.' });
  }
});

// @route   GET /api/attendance/session/:sessionId
// @desc    Get attendance for a specific session
// @access  Private (Faculty, Admin)
router.get('/session/:sessionId', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { date, status } = req.query;

    let query = { session: sessionId };

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: filterDate,
        $lt: nextDay
      };
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const attendance = await Attendance.find(query)
      .populate(['student', 'session'])
      .sort({ date: -1, checkInTime: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get session attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
// @access  Private (Faculty, Admin, Student - own data)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { sessionId, startDate, endDate } = req.query;

    // Check if user can access this data
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    let query = { student: studentId };

    // Filter by session if provided
    if (sessionId) {
      query.session = sessionId;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .populate(['session', 'student'])
      .sort({ date: -1, checkInTime: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/attendance/my
// @desc    Get current user's attendance
// @access  Private (Student)
router.get('/my', auth, authorize('student'), async (req, res) => {
  try {
    const { sessionId, startDate, endDate } = req.query;

    let query = { student: req.user._id };

    // Filter by session if provided
    if (sessionId) {
      query.session = sessionId;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find(query)
      .populate(['session'])
      .sort({ date: -1, checkInTime: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private (Faculty, Admin)
router.put('/:id', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { status, notes, checkOutTime } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (checkOutTime) updateData.checkOutTime = new Date(checkOutTime);

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['session', 'student']);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error during attendance update.' });
  }
});

// @route   POST /api/attendance/:id/verify
// @desc    Verify attendance record
// @access  Private (Faculty, Admin)
router.post('/:id/verify', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    ).populate(['session', 'student']);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found.' });
    }

    res.json({
      message: 'Attendance verified successfully',
      attendance
    });
  } catch (error) {
    console.error('Verify attendance error:', error);
    res.status(500).json({ message: 'Server error during attendance verification.' });
  }
});

// Helper function to validate location
function validateLocation(userLocation, sessionLocation, radius) {
  const distance = calculateDistance(userLocation, sessionLocation);
  return distance <= radius;
}

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

module.exports = router;
