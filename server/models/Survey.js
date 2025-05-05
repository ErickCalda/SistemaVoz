const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['open', 'single', 'multiple', 'rating', 'yesno'],
    required: true
  },
  options: {
    type: [String],
    default: []
  }
});

const SurveySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  welcomeMessage: {
    type: String,
    default: '¡Hola! Gracias por participar en nuestra encuesta por voz.'
  },
  farewell: {
    type: String,
    default: 'Gracias por completar la encuesta. ¡Tus respuestas son muy valiosas para nosotros!'
  },
  questions: {
    type: [QuestionSchema],
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  allowAnonymous: {
    type: Boolean,
    default: true
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  shareUrl: {
    type: String
  }
});

// Update the updatedAt timestamp before saving
SurveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Survey', SurveySchema);
