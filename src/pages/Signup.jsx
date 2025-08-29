import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiUserCheck } from 'react-icons/fi';
import authService from '../api/authService';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'student',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Pre-fill email/mobile if coming from login
    if (location.state?.emailOrMobile) {
      const value = location.state.emailOrMobile;
      if (value.includes('@')) {
        setFormData(prev => ({ ...prev, email: value }));
      } else {
        setFormData(prev => ({ ...prev, mobile: value }));
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.mobile || !formData.designation) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.signup(formData);
      
      if (response.success) {
        login(response.user);
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4">
      <div className="glass-card fade-in" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="mb-2">Create Account 🚀</h2>
          <p className="text-muted">Fill in your details to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-12 mb-3">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="name">
                  <FiUser className="me-2" />Full Name
                </label>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-floating">
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="email">
                  <FiMail className="me-2" />Email
                </label>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-floating">
                <input
                  type="tel"
                  className="form-control"
                  id="mobile"
                  name="mobile"
                  placeholder="Mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="mobile">
                  <FiPhone className="me-2" />Mobile
                </label>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-floating">
                <select
                  className="form-select"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                  <option value="company">Company Representative</option>
                </select>
                <label htmlFor="role">
                  <FiUserCheck className="me-2" />Role
                </label>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="designation"
                  name="designation"
                  placeholder="Designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
                <label htmlFor="designation">
                  <FiBriefcase className="me-2" />Designation
                </label>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-gradient w-100 mb-3"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <button 
            type="button" 
            className="btn btn-outline-gradient w-100"
            onClick={() => navigate('/login')}
            disabled={loading}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;