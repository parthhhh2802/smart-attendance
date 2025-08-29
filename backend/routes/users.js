const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const { auth, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('company');

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, department, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('company');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
});

// @route   GET /api/users/students
// @desc    Get all students (filtered by company if faculty/company)
// @access  Private (Faculty, Admin, Company)
router.get('/students', auth, authorize('faculty', 'admin', 'company'), async (req, res) => {
  try {
    let query = { role: 'student', isActive: true };

    // Filter by company if user is faculty or company
    if (req.user.role === 'faculty' || req.user.role === 'company') {
      query.company = req.user.company;
    }

    const students = await User.find(query)
      .select('-password')
      .populate('company')
      .sort({ name: 1 });

    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/users/faculty
// @desc    Get all faculty (filtered by company if company user)
// @access  Private (Admin, Company)
router.get('/faculty', auth, authorize('admin', 'company'), async (req, res) => {
  try {
    let query = { role: 'faculty', isActive: true };

    // Filter by company if user is company
    if (req.user.role === 'company') {
      query.company = req.user.company;
    }

    const faculty = await User.find(query)
      .select('-password')
      .populate('company')
      .sort({ name: 1 });

    res.json({ faculty });
  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin, Faculty - own company, Student - own data)
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('company');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user can access this data
    if (req.user.role === 'student' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (req.user.role === 'faculty' && user.company?.toString() !== req.user.company?.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID
// @access  Private (Admin, Faculty - own company)
router.put('/:id', auth, authorize('admin', 'faculty'), async (req, res) => {
  try {
    const { name, phone, department, isActive } = req.body;

    // Check if faculty can update this user
    if (req.user.role === 'faculty') {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser || targetUser.company?.toString() !== req.user.company?.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('company');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error during user update.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user by ID
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error during user deletion.' });
  }
});

// @route   GET /api/users/company/:companyId
// @desc    Get users by company ID
// @access  Private (Admin, Company - own company)
router.get('/company/:companyId', auth, authorize('admin', 'company'), async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company user can access this company
    if (req.user.role === 'company' && req.user.company?.toString() !== companyId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const users = await User.find({ company: companyId, isActive: true })
      .select('-password')
      .populate('company')
      .sort({ role: 1, name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/users/bulk-register
// @desc    Bulk register students for a session
// @access  Private (Faculty, Admin)
router.post('/bulk-register', auth, authorize('faculty', 'admin'), async (req, res) => {
  try {
    const { sessionId, studentIds } = req.body;

    if (!sessionId || !studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({ 
        message: 'Session ID and array of student IDs are required.' 
      });
    }

    const Session = require('../models/Session');
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if faculty can access this session
    if (req.user.role === 'faculty' && session.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Check if session is full
    if (session.students.length + studentIds.length > session.maxStudents) {
      return res.status(400).json({ 
        message: 'Adding these students would exceed the session capacity.' 
      });
    }

    // Add students to session
    const newStudents = [];
    for (const studentId of studentIds) {
      // Check if student is already registered
      const isRegistered = session.students.some(
        student => student.student.toString() === studentId
      );

      if (!isRegistered) {
        newStudents.push({
          student: studentId,
          registeredAt: new Date()
        });
      }
    }

    session.students.push(...newStudents);
    await session.save();

    // Populate references
    await session.populate(['faculty', 'company', 'students.student']);

    res.json({
      message: `${newStudents.length} students registered successfully`,
      session
    });
  } catch (error) {
    console.error('Bulk register error:', error);
    res.status(500).json({ message: 'Server error during bulk registration.' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name, email, or student ID
// @access  Private (Faculty, Admin, Company)
router.get('/search', auth, authorize('faculty', 'admin', 'company'), async (req, res) => {
  try {
    const { q, role, company } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    };

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Filter by company if user is faculty or company
    if (req.user.role === 'faculty' || req.user.role === 'company') {
      query.company = req.user.company;
    } else if (company) {
      query.company = company;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('company')
      .limit(20)
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
