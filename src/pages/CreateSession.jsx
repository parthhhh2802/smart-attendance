import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiMapPin, FiList, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import sessionService from '../api/sessionService';

const CreateSession = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: { lat: '', lng: '' },
    radius: 50,
    feedbackRequired: false,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: 'rating',
    options: []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'lat' || name === 'lng') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: parseFloat(value) || ''
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text) {
      toast.error('Please enter question text');
      return;
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion, id: Date.now() }]
    }));

    setCurrentQuestion({
      text: '',
      type: 'rating',
      options: []
    });
  };

  const handleRemoveQuestion = (id) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }));
          toast.success('Location captured successfully!');
        },
        (error) => {
          toast.error('Failed to get location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!formData.location.lat || !formData.location.lng) {
      toast.error('Please set the session location');
      return;
    }

    if (formData.feedbackRequired && formData.questions.length === 0) {
      toast.error('Please add at least one feedback question');
      return;
    }

    setLoading(true);
    try {
      const response = await sessionService.createSession(formData);
      
      if (response.success) {
        toast.success('Session created successfully!');
        navigate(`/sessions/${response.session.id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="fade-in">
        <div className="glass-card mb-4">
          <h2 className="mb-1">Create New Session</h2>
          <p className="text-muted">Set up a new attendance session with QR code validation</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card mb-4">
            <h5 className="mb-3">Basic Information</h5>
            
            <div className="row">
              <div className="col-md-12 mb-3">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    placeholder="Session Title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="title">
                    <FiList className="me-2" />Session Title
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="date">
                    <FiCalendar className="me-2" />Date
                  </label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="time"
                    className="form-control"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="time">
                    <FiClock className="me-2" />Time
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card mb-4">
            <h5 className="mb-3">Location Settings</h5>
            
            <div className="row">
              <div className="col-md-5 mb-3">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    id="lat"
                    name="lat"
                    placeholder="Latitude"
                    value={formData.location.lat}
                    onChange={handleChange}
                    step="any"
                    required
                  />
                  <label htmlFor="lat">
                    <FiMapPin className="me-2" />Latitude
                  </label>
                </div>
              </div>

              <div className="col-md-5 mb-3">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    id="lng"
                    name="lng"
                    placeholder="Longitude"
                    value={formData.location.lng}
                    onChange={handleChange}
                    step="any"
                    required
                  />
                  <label htmlFor="lng">
                    <FiMapPin className="me-2" />Longitude
                  </label>
                </div>
              </div>

              <div className="col-md-2 mb-3">
                <button
                  type="button"
                  className="btn btn-outline-gradient w-100 h-100"
                  onClick={getCurrentLocation}
                >
                  Get Current
                </button>
              </div>

              <div className="col-md-12 mb-3">
                <label htmlFor="radius" className="form-label">
                  Attendance Radius: <strong>{formData.radius}m</strong>
                </label>
                <input
                  type="range"
                  className="form-range"
                  id="radius"
                  name="radius"
                  min="10"
                  max="500"
                  value={formData.radius}
                  onChange={handleChange}
                />
                <div className="d-flex justify-content-between">
                  <small className="text-muted">10m</small>
                  <small className="text-muted">500m</small>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card mb-4">
            <h5 className="mb-3">Feedback Settings</h5>
            
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="feedbackRequired"
                name="feedbackRequired"
                checked={formData.feedbackRequired}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="feedbackRequired">
                Require feedback for attendance
              </label>
            </div>

            {formData.feedbackRequired && (
              <>
                <div className="border rounded p-3 mb-3">
                  <div className="row">
                    <div className="col-md-8 mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter question text"
                        value={currentQuestion.text}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3 mb-2">
                      <select
                        className="form-select"
                        value={currentQuestion.type}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="rating">Rating (1-5)</option>
                        <option value="text">Text Answer</option>
                        <option value="choice">Multiple Choice</option>
                      </select>
                    </div>
                    <div className="col-md-1 mb-2">
                      <button
                        type="button"
                        className="btn btn-gradient w-100"
                        onClick={handleAddQuestion}
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                </div>

                {formData.questions.length > 0 && (
                  <div className="mt-3">
                    <h6>Questions ({formData.questions.length})</h6>
                    {formData.questions.map((question, index) => (
                      <div key={question.id} className="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                        <div>
                          <strong>{index + 1}.</strong> {question.text}
                          <span className="badge bg-secondary ms-2">{question.type}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRemoveQuestion(question.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-gradient flex-fill"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating Session...
                </>
              ) : (
                <>
                  <FiSave className="me-2" />Create Session
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-gradient"
              onClick={() => navigate('/sessions')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSession;