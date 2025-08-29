const express = require('express');
const PDFDocument = require('pdfkit');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { auth, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/dashboard
// @desc    Get dashboard analytics
// @access  Private (Faculty, Admin, Company)
router.get('/dashboard', auth, authorize('faculty', 'admin', 'company'), async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Filter by company if user is faculty or company
    if (req.user.role === 'faculty') {
      query.faculty = req.user._id;
    } else if (req.user.role === 'company') {
      query.company = req.user.company;
    }

    const sessions = await Session.find(query).populate(['faculty', 'company']);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate statistics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(session => 
      session.startDate <= today && session.endDate >= today
    ).length;
    
    const upcomingSessions = sessions.filter(session => 
      session.startDate > today
    ).length;

    // Get total students across all sessions
    const totalStudents = sessions.reduce((sum, session) => 
      sum + session.students.length, 0
    );

    // Get today's attendance
    const todayAttendance = await Attendance.find({
      session: { $in: sessions.map(s => s._id) },
      date: today
    }).populate(['session', 'student']);

    const presentToday = todayAttendance.filter(att => att.status === 'present').length;
    const absentToday = totalStudents - presentToday;

    // Get recent feedback
    const recentFeedback = await Feedback.find({
      session: { $in: sessions.map(s => s._id) }
    })
    .populate(['session', 'student'])
    .sort({ submittedAt: -1 })
    .limit(5);

    // Calculate average rating
    const allFeedback = await Feedback.find({
      session: { $in: sessions.map(s => s._id) }
    });
    
    const averageRating = allFeedback.length > 0 
      ? allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / allFeedback.length 
      : 0;

    res.json({
      totalSessions,
      activeSessions,
      upcomingSessions,
      totalStudents,
      todayAttendance: {
        present: presentToday,
        absent: absentToday,
        total: totalStudents
      },
      recentFeedback,
      averageRating: Math.round(averageRating * 100) / 100
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/reports/attendance/:sessionId
// @desc    Get detailed attendance report for a session
// @access  Private (Faculty, Admin)
router.get('/attendance/:sessionId', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { startDate, endDate } = req.query;

    const session = await Session.findById(sessionId)
      .populate(['faculty', 'company', 'students.student']);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateQuery = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find({
      session: sessionId,
      ...dateQuery
    }).populate(['student']);

    // Group attendance by date
    const attendanceByDate = {};
    attendance.forEach(att => {
      const dateStr = att.date.toISOString().split('T')[0];
      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = {
          present: [],
          absent: [],
          late: [],
          excused: []
        };
      }
      attendanceByDate[dateStr][att.status].push(att);
    });

    // Calculate summary statistics
    const totalDays = Object.keys(attendanceByDate).length;
    const totalStudents = session.students.length;
    
    const summary = {
      totalDays,
      totalStudents,
      averageAttendance: 0,
      attendanceRate: 0
    };

    if (totalDays > 0) {
      const totalPresent = attendance.filter(att => att.status === 'present').length;
      summary.averageAttendance = Math.round(totalPresent / totalDays);
      summary.attendanceRate = Math.round((totalPresent / (totalDays * totalStudents)) * 100);
    }

    res.json({
      session,
      attendanceByDate,
      summary,
      rawAttendance: attendance
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/reports/student/:studentId
// @desc    Get detailed attendance report for a student
// @access  Private (Faculty, Admin, Student - own data)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user can access this data
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateQuery = {
        $gte: start,
        $lte: end
      };
    }

    const attendance = await Attendance.find({
      student: studentId,
      ...dateQuery
    }).populate(['session']);

    // Group attendance by session
    const attendanceBySession = {};
    attendance.forEach(att => {
      const sessionId = att.session._id.toString();
      if (!attendanceBySession[sessionId]) {
        attendanceBySession[sessionId] = {
          session: att.session,
          attendance: []
        };
      }
      attendanceBySession[sessionId].attendance.push(att);
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(att => att.status === 'present').length;
    const absentDays = attendance.filter(att => att.status === 'absent').length;
    const lateDays = attendance.filter(att => att.status === 'late').length;
    const excusedDays = attendance.filter(att => att.status === 'excused').length;

    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      student,
      attendanceBySession,
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate
      }
    });
  } catch (error) {
    console.error('Get student report error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/reports/pdf/session/:sessionId
// @desc    Generate PDF report for a session
// @access  Private (Faculty, Admin)
router.get('/pdf/session/:sessionId', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { includeFeedback } = req.query;

    const session = await Session.findById(sessionId)
      .populate(['faculty', 'company', 'students.student']);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Get attendance data
    const attendance = await Attendance.find({ session: sessionId })
      .populate(['student'])
      .sort({ date: 1 });

    // Get feedback if requested
    let feedback = null;
    if (includeFeedback === 'true') {
      feedback = await Feedback.find({ session: sessionId })
        .populate(['student'])
        .sort({ submittedAt: -1 });
    }

    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="session-report-${sessionId}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(24).text('Session Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text(`Session: ${session.title}`);
    doc.fontSize(12).text(`Type: ${session.type}`);
    doc.fontSize(12).text(`Start Date: ${session.startDate.toLocaleDateString()}`);
    doc.fontSize(12).text(`End Date: ${session.endDate.toLocaleDateString()}`);
    doc.fontSize(12).text(`Faculty: ${session.faculty.name}`);
    doc.fontSize(12).text(`Company: ${session.company.name}`);
    doc.moveDown();

    // Attendance summary
    doc.fontSize(16).text('Attendance Summary');
    doc.moveDown();
    
    const totalStudents = session.students.length;
    const totalDays = attendance.length > 0 ? 
      Math.ceil((session.endDate - session.startDate) / (1000 * 60 * 60 * 24)) : 0;
    
    doc.fontSize(12).text(`Total Students: ${totalStudents}`);
    doc.fontSize(12).text(`Total Days: ${totalDays}`);
    
    if (attendance.length > 0) {
      const presentCount = attendance.filter(att => att.status === 'present').length;
      const absentCount = attendance.filter(att => att.status === 'absent').length;
      
      doc.fontSize(12).text(`Present: ${presentCount}`);
      doc.fontSize(12).text(`Absent: ${absentCount}`);
      doc.fontSize(12).text(`Attendance Rate: ${Math.round((presentCount / (totalStudents * totalDays)) * 100)}%`);
    }
    
    doc.moveDown();

    // Student list with attendance
    if (attendance.length > 0) {
      doc.fontSize(16).text('Student Attendance Details');
      doc.moveDown();
      
      session.students.forEach(student => {
        const studentAttendance = attendance.filter(att => 
          att.student._id.toString() === student.student._id.toString()
        );
        
        const presentDays = studentAttendance.filter(att => att.status === 'present').length;
        const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
        
        doc.fontSize(12).text(`${student.student.name} (${student.student.studentId})`);
        doc.fontSize(10).text(`  Present: ${presentDays}/${totalDays} days (${attendanceRate}%)`);
        doc.moveDown(0.5);
      });
    }

    // Feedback summary if included
    if (feedback && feedback.length > 0) {
      doc.addPage();
      doc.fontSize(16).text('Feedback Summary');
      doc.moveDown();
      
      const averageRating = feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length;
      doc.fontSize(12).text(`Average Rating: ${Math.round(averageRating * 100) / 100}/5`);
      doc.fontSize(12).text(`Total Feedback: ${feedback.length}`);
      doc.moveDown();
      
      // Rating distribution
      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = feedback.filter(fb => fb.rating === i).length;
      }
      
      doc.fontSize(12).text('Rating Distribution:');
      Object.entries(ratingDistribution).forEach(([rating, count]) => {
        doc.fontSize(10).text(`  ${rating} stars: ${count} responses`);
      });
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Server error during PDF generation.' });
  }
});

// @route   GET /api/reports/export/attendance/:sessionId
// @desc    Export attendance data as CSV
// @access  Private (Faculty, Admin)
router.get('/export/attendance/:sessionId', auth, authorize('faculty', 'admin'), checkOwnership('Session'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { format } = req.query;

    const session = await Session.findById(sessionId)
      .populate(['faculty', 'company', 'students.student']);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    const attendance = await Attendance.find({ session: sessionId })
      .populate(['student'])
      .sort({ date: 1, 'student.name': 1 });

    if (format === 'csv') {
      // Generate CSV
      let csv = 'Date,Student Name,Student ID,Status,Check-in Time,Location Valid\n';
      
      attendance.forEach(att => {
        const date = att.date.toLocaleDateString();
        const studentName = att.student.name;
        const studentId = att.student.studentId || 'N/A';
        const status = att.status;
        const checkInTime = att.checkInTime.toLocaleTimeString();
        const locationValid = att.location.isWithinRadius ? 'Yes' : 'No';
        
        csv += `${date},"${studentName}","${studentId}",${status},${checkInTime},${locationValid}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${sessionId}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        session,
        attendance
      });
    }
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ message: 'Server error during export.' });
  }
});

module.exports = router;
