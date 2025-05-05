const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ResponseSchema = new mongoose.Schema({
  surveyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  respondentName: {
    type: String
  },
  answers: {
    type: [AnswerSchema],
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
});

// Calculate completion time in seconds
ResponseSchema.virtual('completionTime').get(function() {
  if (this.endTime && this.startTime) {
    return (this.endTime - this.startTime) / 1000;
  }
  return null;
});

// Include virtuals when converting to JSON
ResponseSchema.set('toJSON', { virtuals: true });
ResponseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Response', ResponseSchema);
