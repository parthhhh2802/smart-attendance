import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiStar, FiSend } from 'react-icons/fi';
import sessionService from '../api/sessionService';
import { useAuth } from '../context/AuthContext';

const FeedbackForm = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    rating: 0,
    comments: '',
    answers: {}
  });
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await sessionService.getSessionById(sessionId);
      if (response.success) {
        setSession(response.session);
        
        // Initialize answers for custom questions
        if (response.session.questions) {
          const initialAnswers = {};
          response.session.questions.forEach(q => {
            initialAnswers[q.id] = '';
          });
          setFeedback(prev => ({ ...prev, answers: initialAnswers }));
        }
      }
    } catch (error) {
      toast.error('Failed to fetch session details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (value) => {
    setFeedback(prev => ({ ...prev, rating: value }));
  };

  const handleAnswerChange = (questionId, value) => {
    setFeedback(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (feedback.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      const response = await sessionService.submitFeedback(
        sessionId,
        user.id,
        feedback
      );

      if (response.success) {
        toast.success('Feedback submitted successfully!');
        navigate(`/sessions/${sessionId}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="mb-2">Session Feedback</h2>
          <p className="text-muted">{session?.title}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card mb-4">
            <h5 className="mb-3">Overall Rating</h5>
            
            <div className="d-flex justify-content-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  className="btn btn-lg p-2"
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <FiStar
                    size={32}
                    style={{
                      fill: value <= (hoveredRating || feedback.rating) ? '#fbbf24' : 'transparent',
                      stroke: value <= (hoveredRating || feedback.rating) ? '#fbbf24' : '#d1d5db',
                      transition: 'all 0.2s'
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="text-center text-muted">
              {feedback.rating > 0 && (
                <span>
                  {feedback.rating === 5 && 'Excellent!'}
                  {feedback.rating === 4 && 'Very Good'}
                  {feedback.rating === 3 && 'Good'}
                  {feedback.rating === 2 && 'Fair'}
                  {feedback.rating === 1 && 'Poor'}
                </span>
              )}
            </div>
          </div>

          {/* Custom Questions */}
          {session?.questions && session.questions.length > 0 && (
            <div className="glass-card mb-4">
              <h5 className="mb-3">Additional Questions</h5>
              
              {session.questions.map((question, index) => (
                <div key={question.id} className="mb-3">
                  <label className="form-label">
                    {index + 1}. {question.text}
                  </label>
                  
                  {question.type === 'rating' && (
                    <div className="d-flex gap-2">
                      {[1, 2, 3, 4, 5].map(value => (
                        <div key={value} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`question-${question.id}`}
                            id={`q${question.id}-${value}`}
                            value={value}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          />
                          <label className="form-check-label" htmlFor={`q${question.id}-${value}`}>
                            {value}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'text' && (
                    <textarea
                      className="form-control"
                      rows="2"
                      value={feedback.answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your answer..."
                    />
                  )}
                  
                  {question.type === 'choice' && question.options && (
                    <select
                      className="form-select"
                      value={feedback.answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {question.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div className="glass-card mb-4">
            <h5 className="mb-3">Additional Comments (Optional)</h5>
            
            <textarea
              className="form-control"
              rows="4"
              placeholder="Share your thoughts about the session..."
              value={feedback.comments}
              onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            />
          </div>

          {/* Submit Button */}
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-gradient flex-fill"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="me-2" />Submit Feedback
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline-gradient"
              onClick={() => navigate('/sessions')}
              disabled={submitting}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;