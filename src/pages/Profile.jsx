import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiUserCheck, FiSave, FiEdit } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import authService from '../api/authService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    role: user?.role || 'student',
    designation: user?.designation || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await authService.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.user);
        toast.success('Profile updated successfully!');
        setEditing(false);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      role: user?.role || 'student',
      designation: user?.designation || ''
    });
    setEditing(false);
  };

  return (
    <div className="container py-4">
      <div className="fade-in">
        <div className="glass-card mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">My Profile</h2>
              <p className="text-muted">Manage your account information</p>
            </div>
            {!editing && (
              <button 
                className="btn btn-gradient"
                onClick={() => setEditing(true)}
              >
                <FiEdit className="me-2" />Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 mb-4">
            <div className="glass-card text-center">
              <div className="mb-3">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle" style={{ width: '100px', height: '100px' }}>
                  <FiUser size={48} className="text-primary" />
                </div>
              </div>
              <h4 className="mb-1">{user?.name}</h4>
              <p className="text-muted mb-3">{user?.designation}</p>
              <div className="d-flex justify-content-center gap-2 mb-3">
                <span className="badge badge-gradient">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
              </div>
              <small className="text-muted">
                Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </small>
            </div>
          </div>

          <div className="col-lg-8 mb-4">
            <div className="glass-card">
              <h5 className="mb-3">Account Information</h5>
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing || loading}
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
                        disabled={!editing || loading}
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
                        disabled={!editing || loading}
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
                        disabled={true} // Role cannot be changed
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
                        disabled={!editing || loading}
                        required
                      />
                      <label htmlFor="designation">
                        <FiBriefcase className="me-2" />Designation
                      </label>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-gradient"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave className="me-2" />Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-gradient"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Activity Stats */}
            <div className="glass-card mt-4">
              <h5 className="mb-3">Activity Statistics</h5>
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="stat-card">
                    <div className="stat-value">12</div>
                    <div className="stat-label">Sessions Attended</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
                    <div className="stat-value">95%</div>
                    <div className="stat-label">Attendance Rate</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
                    <div className="stat-value">4.5</div>
                    <div className="stat-label">Avg Feedback</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;