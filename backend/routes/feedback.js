const express = require('express');
const Feedback = require('../models/Feedback');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const { auth, authorize, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback for a session
// @access  Private (Student)
router.post('/', auth, authorize('student'), async (req, res) => {
  try {
    const { sessionId, rating, questions, overallFeedback } = req.body;

    if (!sessionId || !rating || !questions || questions.length === 0) {
      return res.status(400).json({ 
        message: 'Session ID, rating, and questions are required.' 
      });
    }

    // Check if rating is valid
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Check if student has attendance for this session
    const attendance = await Attendance.findOne({
      session: sessionId,
      student: req.user._id
    });

    if (!attendance) {
      return res.status(400).json({ 
        message: 'You must have attendance for this session to submit feedback.' 
      });
    }

    // Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({
      session: sessionId,
      student: req.user._id
    });

    if (existingFeedback) {
      return res.status(400).json({ 
        message: 'Feedback already submitted for this session.' 
      });
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question || !question.type || !question.answer) {
        return res.status(400).json({ 
          message: 'All questions must have question text, type, and answer.' 
        });
      }

      // Validate answer based on question type
      if (question.type === 'rating' && (question.answer < 1 || question.answer > 5)) {
        return res.status(400).json({ 
          message: 'Rating answers must be between 1 and 5.' 
        });
      }

      if (question.type === 'dropdown' && question.options && !question.options.includes(question.answer)) {
        return res.status(400).json({ 
          message: 'Dropdown answer must be one of the provided options.' 
        });
      }

      if (question.type === 'multiple_choice' && question.options && !question.options.includes(question.answer)) {
        return res.status(400).json({ 
          message: 'Multiple choice answer must be one of the provided options.' 
        });
      }
    }

    // Create feedback
    const feedback = new Feedback({
      session: sessionId,
      student: req.user._id,
      attendance: attendance._id,
      rating,
      questions,
      overallFeedback
    });

    await feedback.save();

    // Populate references
    await feedback.populate(['session', 'student']);

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error during feedback submission.' });
  }
});

// @route   GET /api/feedback/session/:sessionId
// @desc    Get feedback for a specific session
// @access  Private (Faculty, Admin, Company)
router.get('/session/:sessionId', auth, authorize('faculty', 'admin', 'company'), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, sentiment } = req.query;

    let query = { session: sessionId };

    // Filter by rating if provided
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Filter by sentiment if provided
    if (sentiment) {
      query['sentiment.label'] = sentiment;
    }

    const feedback = await Feedback.find(query)
      .populate(['student', 'session'])
      .sort({ submittedAt: -1 });

    // Make feedback anonymous for company users
    if (req.user.role === 'company') {
      feedback.forEach(fb => {
        fb.student = {
          _id: fb.student._id,
          name: 'Anonymous Student',
          studentId: '***'
        };
      });
    }

    res.json({ feedback });
  } catch (error) {
    console.error('Get session feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/feedback/my
// @desc    Get current user's feedback
// @access  Private (Student)
router.get('/my', auth, authorize('student'), async (req, res) => {
  try {
    const { sessionId } = req.query;

    let query = { student: req.user._id };

    // Filter by session if provided
    if (sessionId) {
      query.session = sessionId;
    }

    const feedback = await Feedback.find(query)
      .populate(['session'])
      .sort({ submittedAt: -1 });

    res.json({ feedback });
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get specific feedback by ID
// @access  Private (Faculty, Admin, Student - own data)
router.get('/:id', auth, checkOwnership('Feedback'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate(['session', 'student', 'attendance']);

    res.json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback
// @access  Private (Student - own data)
router.put('/:id', auth, authorize('student'), checkOwnership('Feedback'), async (req, res) => {
  try {
    const { rating, questions, overallFeedback } = req.body;

    const updateData = {};
    if (rating) updateData.rating = rating;
    if (questions) updateData.questions = questions;
    if (overallFeedback !== undefined) updateData.overallFeedback = overallFeedback;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['session', 'student']);

    res.json({
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({ message: 'Server error during feedback update.' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback
// @access  Private (Student - own data, Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found.' });
    }

    // Check if user can delete this feedback
    if (req.user.role !== 'admin' && feedback.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ message: 'Server error during feedback deletion.' });
  }
});

// @route   GET /api/feedback/analytics/session/:sessionId
// @desc    Get feedback analytics for a session
// @access  Private (Faculty, Admin, Company)
router.get('/analytics/session/:sessionId', auth, authorize('faculty', 'admin', 'company'), async (req, res) => {
  try {
    const { sessionId } = req.params;

    const feedback = await Feedback.find({ session: sessionId });

    if (feedback.length === 0) {
      return res.json({
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: {},
        sentimentDistribution: {},
        topKeywords: [],
        responseRate: 0
      });
    }

    // Calculate analytics
    const totalFeedback = feedback.length;
    const averageRating = feedback.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback;

    // Rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = feedback.filter(fb => fb.rating === i).length;
    }

    // Sentiment distribution
    const sentimentDistribution = {
      positive: feedback.filter(fb => fb.sentiment?.label === 'positive').length,
      negative: feedback.filter(fb => fb.sentiment?.label === 'negative').length,
      neutral: feedback.filter(fb => fb.sentiment?.label === 'neutral').length
    };

    // Get session to calculate response rate
    const session = await Session.findById(sessionId);
    const totalStudents = session ? session.students.length : 0;
    const responseRate = totalStudents > 0 ? (totalFeedback / totalStudents) * 100 : 0;

    // Extract keywords from text feedback
    const textFeedback = feedback
      .filter(fb => fb.overallFeedback)
      .map(fb => fb.overallFeedback.toLowerCase());

    const wordCount = {};
    textFeedback.forEach(text => {
      const words = text.split(/\s+/).filter(word => word.length > 3);
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    res.json({
      totalFeedback,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      sentimentDistribution,
      topKeywords,
      responseRate: Math.round(responseRate * 100) / 100
    });
  } catch (error) {
    console.error('Get feedback analytics error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
