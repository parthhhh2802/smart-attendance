const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['rating', 'dropdown', 'text', 'multiple_choice'],
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    options: [String], // For dropdown and multiple choice questions
    required: {
      type: Boolean,
      default: true
    }
  }],
  overallFeedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sentiment: {
    score: {
      type: Number, // -1 to 1 (negative to positive)
      min: -1,
      max: 1
    },
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  isAnonymous: {
    type: Boolean,
    default: true // Company view is always anonymous
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
feedbackSchema.index({ session: 1, student: 1 }, { unique: true });
feedbackSchema.index({ session: 1, rating: 1 });
feedbackSchema.index({ session: 1, 'sentiment.label': 1 });
feedbackSchema.index({ submittedAt: 1 });

// Virtual for average rating
feedbackSchema.virtual('averageRating').get(function() {
  return this.rating;
});

// Method to calculate sentiment from text
feedbackSchema.methods.analyzeSentiment = async function() {
  try {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'enjoy', 'helpful', 'useful', 'informative'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disappointing', 'boring', 'useless', 'waste', 'hate', 'dislike', 'confusing', 'difficult'];
    
    const text = this.overallFeedback ? this.overallFeedback.toLowerCase() : '';
    const words = text.split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = words.length;
    let score = 0;
    let label = 'neutral';
    
    if (total > 0) {
      score = (positiveCount - negativeCount) / total;
      
      if (score > 0.1) {
        label = 'positive';
      } else if (score < -0.1) {
        label = 'negative';
      } else {
        label = 'neutral';
      }
    }
    
    this.sentiment = {
      score: Math.max(-1, Math.min(1, score)),
      label: label,
      confidence: Math.abs(score)
    };
    
    return this.sentiment;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    this.sentiment = {
      score: 0,
      label: 'neutral',
      confidence: 0
    };
    return this.sentiment;
  }
};

// Pre-save middleware
feedbackSchema.pre('save', function(next) {
  if (this.isModified('overallFeedback') && this.overallFeedback) {
    this.analyzeSentiment().then(() => next()).catch(() => next());
  } else {
    next();
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
