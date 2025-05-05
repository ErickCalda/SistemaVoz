const Survey = require('../models/Survey');
const Response = require('../models/Response');

/**
 * Get all surveys for authenticated user
 * @route GET /api/surveys
 */
const getSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    
    // Get response counts for each survey
    const surveyIds = surveys.map(survey => survey._id);
    const responseCounts = await Response.aggregate([
      { $match: { surveyId: { $in: surveyIds } } },
      { $group: { _id: '$surveyId', count: { $sum: 1 } } }
    ]);
    
    // Create a map of survey ID to response count
    const responseCountMap = {};
    responseCounts.forEach(item => {
      responseCountMap[item._id.toString()] = item.count;
    });
    
    // Add response count to each survey
    const surveysWithResponseCount = surveys.map(survey => {
      const surveyObj = survey.toObject();
      surveyObj.responseCount = responseCountMap[survey._id.toString()] || 0;
      return surveyObj;
    });
    
    res.json(surveysWithResponseCount);
  } catch (error) {
    console.error('Error getting surveys:', error);
    res.status(500).json({ message: 'Error al obtener encuestas' });
  }
};

/**
 * Get survey by ID
 * @route GET /api/surveys/:id
 */
const getSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    // Check if the user owns this survey - only if user is authenticated
    if (req.user && survey.userId !== req.user.uid) {
      // Check if the survey is public (for taking the survey)
      if (!req.query.public) {
        return res.status(403).json({ message: 'No autorizado' });
      }
    }
    
    res.json(survey);
  } catch (error) {
    console.error('Error getting survey:', error);
    res.status(500).json({ message: 'Error al obtener encuesta' });
  }
};

/**
 * Get public survey by ID (no authentication required)
 * @route GET /api/surveys/public/:id
 */
const getPublicSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    if (!survey.isActive) {
      return res.status(403).json({ message: 'Esta encuesta ya no está activa' });
    }
    
    // Only return necessary fields for taking the survey
    const publicSurvey = {
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      welcomeMessage: survey.welcomeMessage,
      farewell: survey.farewell,
      questions: survey.questions.map(q => ({
        _id: q._id,
        text: q.text,
        type: q.type,
        options: q.options
      }))
    };
    
    res.json(publicSurvey);
  } catch (error) {
    console.error('Error getting public survey:', error);
    res.status(500).json({ message: 'Error al obtener encuesta' });
  }
};

/**
 * Get all public surveys
 * @route GET /api/surveys/public
 */
const getPublicSurveys = async (req, res) => {
  try {
    const surveys = await Survey.find({ isActive: true }).sort({ createdAt: -1 });
    
    // Return limited information for public surveys
    const publicSurveys = surveys.map(survey => ({
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      questionCount: survey.questions.length,
      createdAt: survey.createdAt
    }));
    
    res.json(publicSurveys);
  } catch (error) {
    console.error('Error getting public surveys:', error);
    res.status(500).json({ message: 'Error al obtener encuestas públicas' });
  }
};

/**
 * Create a new survey
 * @route POST /api/surveys
 */
const createSurvey = async (req, res) => {
  try {
    const { title, description, welcomeMessage, farewell, questions, isPublic } = req.body;
    
    if (!title || !questions || !questions.length) {
      return res.status(400).json({ message: 'El título y al menos una pregunta son requeridos' });
    }
    
    // Limpiar los IDs de las preguntas para que MongoDB genere nuevos IDs válidos
    const processedQuestions = questions.map(question => {
      // Extraer solo los campos necesarios, omitiendo el ID
      const { text, type, options } = question;
      return { text, type, options };
    });
    
    // Create new survey
    const newSurvey = new Survey({
      title,
      description,
      welcomeMessage,
      farewell,
      questions: processedQuestions,
      userId: req.user.uid,
      isPublic: isPublic || false
    });
    
    const savedSurvey = await newSurvey.save();
    res.status(201).json(savedSurvey);
  } catch (error) {
    console.error('Error creating survey:', error);
    res.status(500).json({ message: 'Error al crear encuesta' });
  }
};

/**
 * Update a survey
 * @route PUT /api/surveys/:id
 */
const updateSurvey = async (req, res) => {
  try {
    const { title, description, welcomeMessage, farewell, questions, isActive, isPublic } = req.body;
    
    // Find survey
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    // Check if the user owns this survey
    if (survey.userId !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Update fields
    if (title) survey.title = title;
    if (description !== undefined) survey.description = description;
    if (welcomeMessage) survey.welcomeMessage = welcomeMessage;
    if (farewell) survey.farewell = farewell;
    if (questions && questions.length > 0) survey.questions = questions;
    if (isActive !== undefined) survey.isActive = isActive;
    if (isPublic !== undefined) survey.isPublic = isPublic;
    
    const updatedSurvey = await survey.save();
    res.json(updatedSurvey);
  } catch (error) {
    console.error('Error updating survey:', error);
    res.status(500).json({ message: 'Error al actualizar encuesta' });
  }
};

/**
 * Delete a survey
 * @route DELETE /api/surveys/:id
 */
const deleteSurvey = async (req, res) => {
  try {
    // Find survey
    const survey = await Survey.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }
    
    // Check if the user owns this survey
    if (survey.userId !== req.user.uid) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    // Delete survey
    await Survey.findByIdAndDelete(req.params.id);
    
    // Also delete associated responses
    await Response.deleteMany({ surveyId: req.params.id });
    
    res.json({ message: 'Encuesta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting survey:', error);
    res.status(500).json({ message: 'Error al eliminar encuesta' });
  }
};

module.exports = {
  getSurveys,
  getSurvey,
  getPublicSurvey,
  getPublicSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey
};
