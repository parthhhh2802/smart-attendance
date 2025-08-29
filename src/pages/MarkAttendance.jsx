import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMapPin, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import QRScanner from '../components/QRScanner';
import sessionService from '../api/sessionService';
import { useAuth } from '../context/AuthContext';

const MarkAttendance = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [locationStatus, setLocationStatus] = useState('checking');

  useEffect(() => {
    fetchSession();
    checkLocation();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await sessionService.getSessionById(sessionId);
      if (response.success) {
        setSession(response.session);
      }
    } catch (error) {
      toast.error('Failed to fetch session details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationStatus('success');
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus('error');
          toast.warning('Location access denied. Using IP-based location.');
          // Fallback to IP-based location
          fetchIPLocation();
        }
      );
    } else {
      setLocationStatus('error');
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const fetchIPLocation = async () => {
    try {
      // Mock IP location for demo
      setLocation({
        lat: 28.6139,
        lng: 77.2090
      });
      setLocationStatus('ip-based');
    } catch (error) {
      console.error('IP location error:', error);
    }
  };

  const handleQRScanSuccess = async (qrData) => {
    setMarking(true);
    try {
      const response = await sessionService.markAttendance(
        sessionId,
        user.id,
        location,
        qrData
      );

      if (response.success) {
        toast.success('Attendance marked successfully!');
        
        if (response.requiresFeedback) {
          // Redirect to feedback form
          navigate(`/feedback/${sessionId}`);
        } else {
          // Redirect to session details
          navigate(`/sessions/${sessionId}`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance');
      setMarking(false);
    }
  };

  const handleQRScanError = (error) => {
    toast.error('Failed to scan QR code. Please try again.');
    console.error('QR scan error:', error);
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
        <div className="glass-card mb-4">
          <h2 className="mb-2">Mark Attendance</h2>
          <p className="text-muted">{session?.title}</p>
        </div>

        {/* Location Status */}
        <div className="glass-card mb-4">
          <h5 className="mb-3">Location Verification</h5>
          
          {locationStatus === 'checking' && (
            <div className="alert alert-info">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Checking your location...
            </div>
          )}

          {locationStatus === 'success' && location && (
            <div className="alert alert-success">
              <FiCheckCircle className="me-2" />
              Location verified successfully
              <div className="mt-2">
                <small>
                  <FiMapPin className="me-1" />
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </small>
              </div>
            </div>
          )}

          {locationStatus === 'error' && (
            <div className="alert alert-warning">
              <FiAlertCircle className="me-2" />
              GPS location unavailable. Using approximate location.
            </div>
          )}

          {locationStatus === 'ip-based' && location && (
            <div className="alert alert-warning">
              <FiAlertCircle className="me-2" />
              Using IP-based location (less accurate)
              <div className="mt-2">
                <small>
                  <FiMapPin className="me-1" />
                  Approximate: Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </small>
              </div>
            </div>
          )}
        </div>

        {/* QR Scanner */}
        <div className="glass-card">
          {location ? (
            <>
              {!marking ? (
                <QRScanner 
                  onScanSuccess={handleQRScanSuccess}
                  onScanError={handleQRScanError}
                />
              ) : (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <h5>Marking attendance...</h5>
                  <p className="text-muted">Please wait while we process your attendance</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <FiMapPin size={48} className="text-muted mb-3" />
              <h5>Waiting for location...</h5>
              <p className="text-muted">Please enable location access to mark attendance</p>
              <button className="btn btn-gradient mt-3" onClick={checkLocation}>
                Retry Location
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;