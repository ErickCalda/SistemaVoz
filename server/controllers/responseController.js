const Response = require('../models/Response');
const Survey = require('../models/Survey');
const nlp = require('compromise');

/**
 * Create a new survey response
 * @route POST /api/responses
 */
const createResponse = async (req, res) => {
  try {
    const { surveyId, respondentName, answers, userAgent } = req.body;
    
    if (!surveyId || !answers || !answers.length) {
      return res.status(400).json({ message: 'ID de encuesta y respuestas son requeridos' });
    }
    
    // Check if survey exists and is active
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    if (!survey.isActive) {
      return res.status(400).json({ message: 'Esta encuesta ya no está activa' });
    }
    
    // Create new response
    const newResponse = new Response({
      surveyId,
      respondentName: respondentName || 'Anónimo',
      answers,
      startTime: new Date(),
      endTime: new Date(),
      completed: true,
      userAgent,
      ipAddress: req.ip
    });
    
    const savedResponse = await newResponse.save();
    res.status(201).json(savedResponse);
  } catch (error) {
    console.error('Error creating response:', error);
    res.status(500).json({ message: 'Error al guardar respuesta' });
  }
};

/**
 * Get all responses (admin only)
 * @route GET /api/responses
 */
const getResponses = async (req, res) => {
  try {
    // This endpoint would typically be restricted to admin users
    const responses = await Response.find().sort({ startTime: -1 });
    res.json(responses);
  } catch (error) {
    console.error('Error getting responses:', error);
    res.status(500).json({ message: 'Error al obtener respuestas' });
  }
};

/**
 * Get response by ID
 * @route GET /api/responses/:id
 */
const getResponseById = async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    
    if (!response) {
      return res.status(404).json({ message: 'Respuesta no encontrada' });
    }
    
    // Check if user owns the survey associated with this response
    const survey = await Survey.findById(response.surveyId);
    if (!survey || survey.userId !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error getting response:', error);
    res.status(500).json({ message: 'Error al obtener respuesta' });
  }
};

/**
 * Get all responses for a survey with analysis
 * @route GET /api/responses/survey/:surveyId
 */
const getSurveyResponses = async (req, res) => {
  try {
    const surveyId = req.params.surveyId;
    
    // Check if user owns this survey
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    if (survey.userId !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Get responses
    const responses = await Response.find({ surveyId }).sort({ startTime: -1 });
    
    // Process and analyze responses
    const analysis = analyzeResponses(survey, responses);
    
    res.json({
      survey,
      responses,
      analysis
    });
  } catch (error) {
    console.error('Error getting survey responses:', error);
    res.status(500).json({ message: 'Error al obtener respuestas de la encuesta' });
  }
};

/**
 * Delete a response
 * @route DELETE /api/responses/:id
 */
const deleteResponse = async (req, res) => {
  try {
    const response = await Response.findById(req.params.id);
    
    if (!response) {
      return res.status(404).json({ message: 'Respuesta no encontrada' });
    }
    
    // Check if user owns the survey associated with this response
    const survey = await Survey.findById(response.surveyId);
    if (!survey || survey.userId !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    await Response.findByIdAndDelete(req.params.id);
    res.json({ message: 'Respuesta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ message: 'Error al eliminar respuesta' });
  }
};

/**
 * Helper function to analyze survey responses
 */
const analyzeResponses = (survey, responses) => {
  const analysis = {
    questionStats: [],
    completionRate: 0,
    averageCompletionTime: 0,
    totalResponses: responses.length,
    completedResponses: 0,
    keywords: {}
  };
  
  // If no responses, return empty analysis
  if (responses.length === 0) {
    return analysis;
  }
  
  // Calculate completion rate and average completion time
  let totalCompletionTime = 0;
  responses.forEach(response => {
    if (response.completed) {
      analysis.completedResponses++;
      
      if (response.completionTime) {
        totalCompletionTime += response.completionTime;
      }
    }
  });
  
  analysis.completionRate = (analysis.completedResponses / analysis.totalResponses) * 100;
  analysis.averageCompletionTime = totalCompletionTime / analysis.completedResponses || 0;
  
  // Analyze each question
  survey.questions.forEach((question, questionIndex) => {
    const questionStat = {
      questionId: question._id,
      questionText: question.text,
      questionType: question.type,
      responseCount: 0,
      valueDistribution: {},
      averageRating: 0,
      keywords: [],
      sentimentAnalysis: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };
    
    // Count responses for this question
    let totalRating = 0;
    let ratingCount = 0;
    let allText = '';
    
    responses.forEach(response => {
      const answer = response.answers.find(a => a.questionId.toString() === question._id.toString());
      
      if (answer) {
        questionStat.responseCount++;
        
        // Process based on question type
        if (question.type === 'rating') {
          const rating = parseInt(answer.value);
          if (!isNaN(rating)) {
            totalRating += rating;
            ratingCount++;
          }
        }
        
        // Count value distribution
        if (!questionStat.valueDistribution[answer.value]) {
          questionStat.valueDistribution[answer.value] = 0;
        }
        questionStat.valueDistribution[answer.value]++;
        
        // Collect text for open-ended questions
        if (question.type === 'open') {
          allText += ' ' + answer.value;
        }
      }
    });
    
    // Calculate average rating if applicable
    if (ratingCount > 0) {
      questionStat.averageRating = totalRating / ratingCount;
    }
    
    // Process text for open-ended questions
    if (question.type === 'open' && allText.trim()) {
      try {
        // Extract keywords using compromise.js
        const doc = nlp(allText);
        
        // Get nouns as keywords
        const nouns = doc.nouns().out('array');
        const uniqueNouns = [...new Set(nouns)];
        questionStat.keywords = uniqueNouns.slice(0, 10); // Top 10 keywords
        
        // Basic sentiment analysis
        const positiveWords = doc.match('(good|great|excellent|amazing|awesome|fantastic|wonderful|happy|satisfied)').length;
        const negativeWords = doc.match('(bad|poor|terrible|awful|horrible|disappointing|unhappy|unsatisfied)').length;
        
        questionStat.sentimentAnalysis = {
          positive: positiveWords,
          negative: negativeWords,
          neutral: questionStat.responseCount - (positiveWords + negativeWords)
        };
      } catch (error) {
        console.error('Error analyzing text:', error);
      }
    }
    
    analysis.questionStats.push(questionStat);
  });
  
  return analysis;
};

module.exports = {
  createResponse,
  getResponses,
  getResponseById,
  getSurveyResponses,
  deleteResponse
};
