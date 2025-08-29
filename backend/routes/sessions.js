const express = require('express');
const QRCode = require('qrcode');
const Session = require('../models/Session');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private (Faculty, Admin)
router.post('/', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      companyName,
      maxStudents
    } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    // Find or create company
    let company = await Company.findOne({ name: companyName });
    if (!company) {
      company = new Company({
        name: companyName,
        admin: req.user._id
      });
      await company.save();
    }

    // Create session
    const session = new Session({
      title,
      description,
      type,
      startDate,
      endDate,
      location,
      faculty: req.user._id,
      company: company._id,
      maxStudents: maxStudents || 50
    });

    // Generate QR codes based on session type
    if (type === 'internship') {
      session.generateDailyQRCodes();
    } else {
      session.generateIndustrialVisitQR();
    }

    await session.save();

    // Populate references
    await session.populate(['faculty', 'company']);

    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error during session creation.' });
  }
});

// @route   GET /api/sessions
// @desc    Get all sessions (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: true };
    let populateFields = ['faculty', 'company'];

    // Filter by user role
    if (req.user.role === 'student') {
      // Students see only sessions they're registered for
      query['students.student'] = req.user._id;
    } else if (req.user.role === 'faculty') {
      // Faculty see their own sessions
      query.faculty = req.user._id;
    } else if (req.user.role === 'company') {
      // Company sees sessions for their company
      query.company = req.user.company;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    const sessions = await Session.find(query)
      .populate(populateFields)
      .sort({ startDate: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/sessions/today
// @desc    Get today's sessions for student
// @access  Private (Student)
router.get('/today', auth, authorize('student'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await Session.find({
      'students.student': req.user._id,
      isActive: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate(['faculty', 'company']);

    // Filter sessions that have active QR codes for today
    const todaySessions = sessions.filter(session => {
      if (session.type === 'internship') {
        return session.qrCodes.some(qr => {
          const qrDate = new Date(qr.date);
          qrDate.setHours(0, 0, 0, 0);
          return qrDate.getTime() === today.getTime() && qr.isActive;
        });
      } else {
        // For industrial visit, check if it's today
        const sessionDate = new Date(session.startDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === today.getTime();
      }
    });

    res.json({ sessions: todaySessions });
  } catch (error) {
    console.error('Get today sessions error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get session by ID
// @access  Private
router.get('/:id', auth, checkOwnership('Session'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate(['faculty', 'company', 'students.student']);

    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update session
// @access  Private (Faculty, Admin)
router.put('/:id', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, maxStudents, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (location) updateData.location = location;
    if (maxStudents) updateData.maxStudents = maxStudents;
    if (status) updateData.status = status;

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['faculty', 'company']);

    res.json({
      message: 'Session updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ message: 'Server error during session update.' });
  }
});

// @route   POST /api/sessions/:id/register
// @desc    Register student for session
// @access  Private (Student)
router.post('/:id/register', auth, authorize('student'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if session is active
    if (!session.isActive) {
      return res.status(400).json({ message: 'Session is not active.' });
    }

    // Check if student is already registered
    const isRegistered = session.students.some(
      student => student.student.toString() === req.user._id.toString()
    );

    if (isRegistered) {
      return res.status(400).json({ message: 'Student is already registered for this session.' });
    }

    // Check if session is full
    if (session.students.length >= session.maxStudents) {
      return res.status(400).json({ message: 'Session is full.' });
    }

    // Register student
    session.students.push({
      student: req.user._id,
      registeredAt: new Date()
    });

    await session.save();

    res.json({
      message: 'Successfully registered for session',
      session
    });
  } catch (error) {
    console.error('Session registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   DELETE /api/sessions/:id/register
// @desc    Unregister student from session
// @access  Private (Student)
router.delete('/:id/register', auth, authorize('student'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Remove student from session
    session.students = session.students.filter(
      student => student.student.toString() !== req.user._id.toString()
    );

    await session.save();

    res.json({
      message: 'Successfully unregistered from session',
      session
    });
  } catch (error) {
    console.error('Session unregistration error:', error);
    res.status(500).json({ message: 'Server error during unregistration.' });
  }
});

// @route   GET /api/sessions/:id/qr
// @desc    Get QR code for session (today's for internship, single for industrial visit)
// @access  Private (Faculty, Admin)
router.get('/:id/qr', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    let qrCode = null;
    if (session.type === 'internship') {
      // Get today's QR code
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      qrCode = session.qrCodes.find(qr => {
        const qrDate = new Date(qr.date);
        qrDate.setHours(0, 0, 0, 0);
        return qrDate.getTime() === today.getTime() && qr.isActive;
      });
    } else {
      // Get the single QR code for industrial visit
      qrCode = session.qrCodes.find(qr => qr.isActive);
    }

    if (!qrCode) {
      return res.status(404).json({ message: 'No active QR code found for this session.' });
    }

    // Generate QR code image
    const qrImage = await QRCode.toDataURL(qrCode.qrData);

    res.json({
      qrCode: qrCode,
      qrImage: qrImage
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/sessions/:id/regenerate-qr
// @desc    Regenerate QR codes for session
// @access  Private (Faculty, Admin)
router.post('/:id/regenerate-qr', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Clear existing QR codes
    session.qrCodes = [];

    // Regenerate QR codes based on session type
    if (session.type === 'internship') {
      session.generateDailyQRCodes();
    } else {
      session.generateIndustrialVisitQR();
    }

    await session.save();

    res.json({
      message: 'QR codes regenerated successfully',
      session
    });
  } catch (error) {
    console.error('Regenerate QR error:', error);
    res.status(500).json({ message: 'Server error during QR regeneration.' });
  }
});

// @route   DELETE /api/sessions/:id
// @desc    Delete session
// @access  Private (Faculty, Admin)
router.delete('/:id', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    res.json({
      message: 'Session deleted successfully',
      session
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error during session deletion.' });
  }
});

module.exports = router;
