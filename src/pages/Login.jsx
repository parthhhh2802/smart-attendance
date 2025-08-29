import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiPhone, FiKey } from 'react-icons/fi';
import authService from '../api/authService';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [step, setStep] = useState(1);
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!emailOrMobile) {
      toast.error('Please enter email or mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOTP(emailOrMobile);
      if (response.success) {
        setStep(2);
        toast.success('OTP sent successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error('Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOTP(emailOrMobile, otp);
      
      if (response.success) {
        if (response.isNewUser) {
          // Redirect to signup page
          navigate('/signup', { 
            state: { 
              emailOrMobile, 
              tempToken: response.tempToken 
            } 
          });
        } else {
          // Login existing user
          login(response.user);
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="glass-card fade-in" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="mb-2">Welcome Back! 👋</h2>
          <p className="text-muted">
            {step === 1 ? 'Enter your email or mobile to continue' : 'Enter the OTP sent to you'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="emailOrMobile"
                placeholder="Email or Mobile"
                value={emailOrMobile}
                onChange={(e) => setEmailOrMobile(e.target.value)}
                disabled={loading}
              />
              <label htmlFor="emailOrMobile">
                <FiMail className="me-2" />Email or Mobile
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-gradient w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="alert alert-info mb-3">
              <small>OTP sent to: <strong>{emailOrMobile}</strong></small>
            </div>

            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="otp"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                disabled={loading}
              />
              <label htmlFor="otp">
                <FiKey className="me-2" />Enter OTP
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-gradient w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>

            <button 
              type="button" 
              className="btn btn-outline-gradient w-100"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Change Email/Mobile
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <small className="text-muted">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;