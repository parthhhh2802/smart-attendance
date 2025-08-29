import axios from 'axios';
import QRCode from 'qrcode';
import { API_BASE_URL, endpoints, mockData } from './config';

class SessionService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.sessions = [...mockData.sessions];
    this.attendance = [];
    this.feedback = [];
  }

  async createSession(sessionData) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSession = {
        id: Date.now(),
        ...sessionData,
        status: 'active',
        createdAt: new Date().toISOString(),
        qrCode: await this.generateQRCode(Date.now().toString()),
        totalAttendees: 0,
        presentCount: 0
      };
      
      this.sessions.push(newSession);
      
      return {
        success: true,
        session: newSession
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessions(filters = {}) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredSessions = [...this.sessions];
      
      // Apply filters
      if (filters.status) {
        filteredSessions = filteredSessions.filter(s => s.status === filters.status);
      }
      
      if (filters.date) {
        filteredSessions = filteredSessions.filter(s => s.date === filters.date);
      }
      
      return {
        success: true,
        sessions: filteredSessions
      };
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async getSessionById(id) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const session = this.sessions.find(s => s.id === parseInt(id));
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Generate fresh QR code
      session.qrCode = await this.generateQRCode(session.id.toString());
      
      return {
        success: true,
        session
      };
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error;
    }
  }

  async generateQRCode(data) {
    try {
      const qrData = {
        sessionId: data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      };
      
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  async markAttendance(sessionId, userId, location, qrData) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const session = this.sessions.find(s => s.id === parseInt(sessionId));
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Validate location (mock validation)
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        session.location.lat,
        session.location.lng
      );
      
      if (distance > session.radius) {
        throw new Error('You are outside the allowed radius for this session');
      }
      
      // Check if QR is valid (mock validation)
      const qrPayload = JSON.parse(qrData);
      if (qrPayload.expiresAt < Date.now()) {
        throw new Error('QR code has expired. Please scan the latest QR code.');
      }
      
      const attendanceRecord = {
        id: Date.now(),
        sessionId,
        userId,
        timestamp: new Date().toISOString(),
        location,
        status: 'present'
      };
      
      this.attendance.push(attendanceRecord);
      
      // Update session counts
      session.presentCount = (session.presentCount || 0) + 1;
      
      return {
        success: true,
        attendance: attendanceRecord,
        requiresFeedback: session.feedbackRequired
      };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async submitFeedback(sessionId, userId, feedbackData) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const feedbackRecord = {
        id: Date.now(),
        sessionId,
        userId,
        ...feedbackData,
        submittedAt: new Date().toISOString()
      };
      
      this.feedback.push(feedbackRecord);
      
      return {
        success: true,
        feedback: feedbackRecord
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async getSessionReport(sessionId) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const session = this.sessions.find(s => s.id === parseInt(sessionId));
      const sessionAttendance = this.attendance.filter(a => a.sessionId === parseInt(sessionId));
      const sessionFeedback = this.feedback.filter(f => f.sessionId === parseInt(sessionId));
      
      return {
        success: true,
        report: {
          session,
          attendance: sessionAttendance,
          feedback: sessionFeedback,
          statistics: {
            totalExpected: session.totalAttendees || 50,
            totalPresent: sessionAttendance.length,
            attendanceRate: ((sessionAttendance.length / (session.totalAttendees || 50)) * 100).toFixed(2),
            feedbackCount: sessionFeedback.length,
            averageRating: this.calculateAverageRating(sessionFeedback)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  calculateAverageRating(feedback) {
    if (feedback.length === 0) return 0;
    
    const totalRating = feedback.reduce((sum, f) => {
      return sum + (f.rating || 0);
    }, 0);
    
    return (totalRating / feedback.length).toFixed(1);
  }
}

export default new SessionService();