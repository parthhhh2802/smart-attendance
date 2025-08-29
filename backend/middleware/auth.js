const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

const checkOwnership = (modelName) => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found.' });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Faculty can access their own sessions
      if (req.user.role === 'faculty' && modelName === 'Session') {
        if (resource.faculty.toString() === req.user._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      // Company admin can access company resources
      if (req.user.role === 'company' && modelName === 'Company') {
        if (resource.admin.toString() === req.user._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      // Students can access their own data
      if (req.user.role === 'student') {
        if (modelName === 'User' && resource._id.toString() === req.user._id.toString()) {
          req.resource = resource;
          return next();
        }
        if (modelName === 'Attendance' && resource.student.toString() === req.user._id.toString()) {
          req.resource = resource;
          return next();
        }
        if (modelName === 'Feedback' && resource.student.toString() === req.user._id.toString()) {
          req.resource = resource;
          return next();
        }
      }

      return res.status(403).json({ message: 'Access denied.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  };
};

module.exports = { auth, authorize, checkOwnership };
