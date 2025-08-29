import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiPlus, FiFilter, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import sessionService from '../api/sessionService';
import { toast } from 'react-toastify';

const Sessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, filter, searchTerm]);

  const fetchSessions = async () => {
    try {
      const response = await sessionService.getSessions();
      if (response.success) {
        setSessions(response.sessions);
      }
    } catch (error) {
      toast.error('Failed to fetch sessions');
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(s => s.status === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-gradient badge-success">Active</span>;
      case 'upcoming':
        return <span className="badge bg-info">Upcoming</span>;
      case 'completed':
        return <span className="badge bg-secondary">Completed</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getAttendanceRate = (session) => {
    if (!session.totalAttendees || session.totalAttendees === 0) return '0';
    return ((session.presentCount / session.totalAttendees) * 100).toFixed(0);
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
        {/* Header */}
        <div className="glass-card mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="mb-1">Sessions</h2>
              <p className="text-muted mb-0">Manage and view all sessions</p>
            </div>
            {user?.role === 'admin' && (
              <Link to="/sessions/create" className="btn btn-gradient">
                <FiPlus className="me-2" />Create Session
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card mb-4">
          <div className="row align-items-center">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="input-group">
                <span className="input-group-text">
                  <FiFilter />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="btn-group w-100" role="group">
                <button
                  className={`btn ${filter === 'all' ? 'btn-gradient' : 'btn-outline-gradient'}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`btn ${filter === 'active' ? 'btn-gradient' : 'btn-outline-gradient'}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`btn ${filter === 'upcoming' ? 'btn-gradient' : 'btn-outline-gradient'}`}
                  onClick={() => setFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={`btn ${filter === 'completed' ? 'btn-gradient' : 'btn-outline-gradient'}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="row">
          {filteredSessions.length === 0 ? (
            <div className="col-12">
              <div className="glass-card text-center py-5">
                <FiCalendar size={48} className="text-muted mb-3" />
                <h5>No Sessions Found</h5>
                <p className="text-muted">
                  {searchTerm ? 'Try adjusting your search criteria' : 'No sessions available at the moment'}
                </p>
                {user?.role === 'admin' && (
                  <Link to="/sessions/create" className="btn btn-gradient mt-3">
                    <FiPlus className="me-2" />Create First Session
                  </Link>
                )}
              </div>
            </div>
          ) : (
            filteredSessions.map(session => (
              <div key={session.id} className="col-lg-6 mb-4">
                <div className={`glass-card h-100 session-card ${session.status}`}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="mb-0">{session.title}</h5>
                    {getStatusBadge(session.status)}
                  </div>

                  <div className="mb-3">
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FiCalendar className="me-2" />
                      <span>{session.date}</span>
                    </div>
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FiClock className="me-2" />
                      <span>{session.time}</span>
                    </div>
                    <div className="d-flex align-items-center text-muted mb-2">
                      <FiMapPin className="me-2" />
                      <span>Radius: {session.radius}m</span>
                    </div>
                    <div className="d-flex align-items-center text-muted">
                      <FiUsers className="me-2" />
                      <span>{session.presentCount || 0} / {session.totalAttendees || 0} Attendees</span>
                    </div>
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Attendance Rate</small>
                      <small className="fw-bold">{getAttendanceRate(session)}%</small>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${getAttendanceRate(session)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="d-flex gap-2 mb-3">
                    {session.feedbackRequired ? (
                      <span className="badge bg-primary">
                        <FiCheckCircle className="me-1" />Feedback Required
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        <FiXCircle className="me-1" />No Feedback
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <Link 
                      to={`/sessions/${session.id}`} 
                      className="btn btn-sm btn-gradient flex-fill"
                    >
                      View Details
                    </Link>
                    {user?.role === 'student' && session.status === 'active' && (
                      <Link 
                        to={`/attendance/${session.id}`} 
                        className="btn btn-sm btn-outline-gradient flex-fill"
                      >
                        Mark Attendance
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sessions;