import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiRefreshCw, FiDownload, FiShare2, FiEdit } from 'react-icons/fi';
import sessionService from '../api/sessionService';
import { useAuth } from '../context/AuthContext';

const SessionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      const response = await sessionService.getSessionById(id);
      if (response.success) {
        setSession(response.session);
        setQrCode(response.session.qrCode);
      }

      // Fetch report data
      const reportResponse = await sessionService.getSessionReport(id);
      if (reportResponse.success) {
        setReport(reportResponse.report);
      }
    } catch (error) {
      toast.error('Failed to fetch session details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshQRCode = async () => {
    setRefreshing(true);
    try {
      const newQrCode = await sessionService.generateQRCode(id);
      setQrCode(newQrCode);
      toast.success('QR Code refreshed!');
    } catch (error) {
      toast.error('Failed to refresh QR code');
    } finally {
      setRefreshing(false);
    }
  };

  const shareQRCode = () => {
    // In production, this would share via WhatsApp API
    const shareUrl = `whatsapp://send?text=Join session "${session.title}" using this QR code: ${window.location.origin}/attendance/${id}`;
    window.open(shareUrl, '_blank');
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `session-${id}-qr.png`;
    link.click();
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

  if (!session) {
    return (
      <div className="container py-4">
        <div className="glass-card text-center">
          <h4>Session not found</h4>
          <Link to="/sessions" className="btn btn-gradient mt-3">Back to Sessions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="fade-in">
        {/* Header */}
        <div className="glass-card mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap">
            <div>
              <h2 className="mb-2">{session.title}</h2>
              <div className="d-flex gap-3 flex-wrap">
                <span className="text-muted">
                  <FiCalendar className="me-1" />{session.date}
                </span>
                <span className="text-muted">
                  <FiClock className="me-1" />{session.time}
                </span>
                <span className="text-muted">
                  <FiMapPin className="me-1" />Radius: {session.radius}m
                </span>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="d-flex gap-2">
                <button className="btn btn-outline-gradient">
                  <FiEdit className="me-1" />Edit
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="row">
          {/* QR Code Section */}
          <div className="col-lg-6 mb-4">
            <div className="glass-card h-100">
              <h5 className="mb-3">Session QR Code</h5>
              
              <div className="qr-container text-center mb-3">
                <div className="qr-code-wrapper">
                  <img src={qrCode} alt="Session QR Code" className="img-fluid" />
                </div>
                <small className="text-muted d-block mt-2">
                  Permanent QR Code - No expiration
                </small>
              </div>

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-gradient flex-fill"
                  onClick={refreshQRCode}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <span className="spinner-border spinner-border-sm" />
                  ) : (
                    <FiRefreshCw className="me-1" />
                  )}
                  Refresh
                </button>
                <button 
                  className="btn btn-outline-gradient flex-fill"
                  onClick={downloadQRCode}
                >
                  <FiDownload className="me-1" />Download
                </button>
                <button 
                  className="btn btn-outline-gradient flex-fill"
                  onClick={shareQRCode}
                >
                  <FiShare2 className="me-1" />Share
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="col-lg-6 mb-4">
            <div className="glass-card h-100">
              <h5 className="mb-3">Attendance Statistics</h5>
              
              {report && (
                <>
                  <div className="row mb-3">
                    <div className="col-6">
                      <div className="stat-card">
                        <div className="stat-value">{report.statistics.totalPresent}</div>
                        <div className="stat-label">Present</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-card" style={{ borderLeftColor: '#ef4444' }}>
                        <div className="stat-value">
                          {report.statistics.totalExpected - report.statistics.totalPresent}
                        </div>
                        <div className="stat-label">Absent</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Attendance Rate</span>
                      <strong>{report.statistics.attendanceRate}%</strong>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar bg-success" 
                        style={{ width: `${report.statistics.attendanceRate}%` }}
                      ></div>
                    </div>
                  </div>

                  {session.feedbackRequired && (
                    <div className="border-top pt-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Feedback Collected</span>
                        <strong>{report.statistics.feedbackCount}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Average Rating</span>
                        <strong>⭐ {report.statistics.averageRating}/5.0</strong>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="glass-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Attendance List</h5>
            <div className="d-flex gap-2">
              <Link to="/reports" className="btn btn-sm btn-outline-gradient">
                <FiDownload className="me-1" />Export Report
              </Link>
            </div>
          </div>

          {report?.attendance && report.attendance.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student ID</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {report.attendance.map((record, index) => (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>User {record.userId}</td>
                      <td>{new Date(record.timestamp).toLocaleTimeString()}</td>
                      <td>
                        <span className="badge bg-success">Present</span>
                      </td>
                      <td>
                        {session.feedbackRequired ? (
                          <span className="badge bg-primary">Submitted</span>
                        ) : (
                          <span className="badge bg-secondary">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FiUsers size={32} className="text-muted mb-2" />
              <p className="text-muted">No attendance records yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;