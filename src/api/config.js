// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Endpoints
export const endpoints = {
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    signup: '/auth/signup',
    profile: '/auth/profile'
  },
  sessions: {
    create: '/sessions/create',
    list: '/sessions',
    details: '/sessions/:id',
    update: '/sessions/:id',
    delete: '/sessions/:id',
    qrCode: '/sessions/:id/qr-code',
    markAttendance: '/sessions/:id/attendance',
    submitFeedback: '/sessions/:id/feedback',
    report: '/sessions/:id/report'
  },
  attendance: {
    mark: '/attendance/mark',
    list: '/attendance/list',
    verify: '/attendance/verify'
  },
  reports: {
    generate: '/reports/generate',
    download: '/reports/download/:type'
  }
};

// Mock data for development
export const mockData = {
  users: [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      mobile: '+1234567890',
      role: 'admin',
      designation: 'Professor'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      mobile: '+0987654321',
      role: 'student',
      designation: 'B.Tech CS'
    }
  ],
  sessions: [
    {
      id: 1,
      title: 'AI Workshop',
      date: '2024-01-15',
      time: '10:00 AM',
      location: { lat: 28.6139, lng: 77.2090 },
      radius: 50,
      feedbackRequired: true,
      status: 'active',
      totalAttendees: 45,
      presentCount: 38
    },
    {
      id: 2,
      title: 'Web Development Bootcamp',
      date: '2024-01-16',
      time: '2:00 PM',
      location: { lat: 28.6229, lng: 77.2195 },
      radius: 100,
      feedbackRequired: true,
      status: 'upcoming',
      totalAttendees: 60,
      presentCount: 0
    }
  ]
};