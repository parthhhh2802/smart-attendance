import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiCheckCircle, FiClock, FiTrendingUp, FiCalendar, FiMapPin } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import sessionService from '../api/sessionService';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

const Dashboard = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    totalAttendance: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await sessionService.getSessions();
      if (response.success) {
        setSessions(response.sessions);
        calculateStats(response.sessions);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sessionData) => {
    const total = sessionData.length;
    const active = sessionData.filter(s => s.status === 'active').length;
    const totalAttendance = sessionData.reduce((sum, s) => sum + (s.presentCount || 0), 0);
    const avgAttendance = total > 0 ? (totalAttendance / total).toFixed(1) : 0;

    setStats({
      totalSessions: total,
      activeSessions: active,
      totalAttendance,
      averageAttendance: avgAttendance
    });
  };

  // Chart data
  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [75, 25],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const weeklyChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      label: 'Attendance',
      data: [45, 52, 38, 65, 48, 55],
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2
    }]
  };

  const trendChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Attendance Trend',
      data: [65, 72, 78, 82],
      borderColor: 'rgba(139, 92, 246, 1)',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4
    }]
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border text-primary spinner-border-lg" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="fade-in">
        {/* Welcome Section */}
        <div className="glass-card mb-4">
          <h2 className="mb-1">Welcome back, {user?.name}! 👋</h2>
          <p className="text-muted mb-0">
            {user?.role === 'admin' ? 'Manage your sessions and track attendance' : 'View your attendance and upcoming sessions'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="stat-card">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value">{stats.totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
                <FiCalendar className="text-primary" size={24} />
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value">{stats.activeSessions}</div>
                  <div className="stat-label">Active Sessions</div>
                </div>
                <FiCheckCircle className="text-success" size={24} />
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value">{stats.totalAttendance}</div>
                  <div className="stat-label">Total Attendance</div>
                </div>
                <FiUsers className="text-purple" size={24} />
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="stat-value">{stats.averageAttendance}</div>
                  <div className="stat-label">Avg Attendance</div>
                </div>
                <FiTrendingUp className="text-warning" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="chart-container">
              <h5 className="mb-3">Attendance Overview</h5>
              <Doughnut 
                data={attendanceChartData} 
                options={{ 
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="chart-container">
              <h5 className="mb-3">Weekly Attendance</h5>
              <Bar 
                data={weeklyChartData} 
                options={{ 
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} 
              />
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="chart-container">
              <h5 className="mb-3">Attendance Trend</h5>
              <Line 
                data={trendChartData} 
                options={{ 
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="glass-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Recent Sessions</h5>
            <Link to="/sessions" className="btn btn-sm btn-outline-gradient">
              View All
            </Link>
          </div>

          <div className="row">
            {sessions.slice(0, 3).map(session => (
              <div key={session.id} className="col-md-4 mb-3">
                <div className={`session-card ${session.status}`}>
                  <h6 className="mb-2">{session.title}</h6>
                  <div className="d-flex align-items-center text-muted mb-2">
                    <FiClock className="me-1" size={14} />
                    <small>{session.date} at {session.time}</small>
                  </div>
                  <div className="d-flex align-items-center text-muted mb-3">
                    <FiMapPin className="me-1" size={14} />
                    <small>Radius: {session.radius}m</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge ${session.status === 'active' ? 'badge-gradient badge-success' : 'bg-secondary'}`}>
                      {session.status}
                    </span>
                    <Link to={`/sessions/${session.id}`} className="btn btn-sm btn-outline-primary">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions for Admin */}
        {user?.role === 'admin' && (
          <div className="glass-card mt-4">
            <h5 className="mb-3">Quick Actions</h5>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/sessions/create" className="btn btn-gradient">
                Create New Session
              </Link>
              <Link to="/reports" className="btn btn-outline-gradient">
                Generate Reports
              </Link>
              <Link to="/sessions" className="btn btn-outline-gradient">
                Manage Sessions
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;