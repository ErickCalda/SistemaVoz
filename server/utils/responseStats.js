/**
 * Utility functions for calculating survey response statistics
 */

/**
 * Calculate basic statistics for numeric responses
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistics including mean, median, min, max, and standard deviation
 */
const calculateStats = (values) => {
  if (!values || values.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0
    };
  }
  
  // Convert values to numbers and filter out NaN
  const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
  
  if (numbers.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0
    };
  }
  
  // Sort for median and min/max
  const sorted = [...numbers].sort((a, b) => a - b);
  
  // Calculate mean
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / numbers.length;
  
  // Calculate median
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
  
  // Calculate standard deviation
  const squareDiffs = numbers.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / numbers.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  return {
    count: numbers.length,
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stdDev
  };
};

/**
 * Calculate frequency distribution of values
 * @param {Array} values - Array of values
 * @returns {Object} Frequency distribution object
 */
const calculateFrequency = (values) => {
  if (!values || values.length === 0) {
    return {};
  }
  
  return values.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
};

/**
 * Generate summary statistics for survey responses
 * @param {Array} responses - Array of survey responses
 * @param {Object} survey - Survey object with questions
 * @returns {Object} Object containing statistics for each question
 */
const generateResponseSummary = (responses, survey) => {
  if (!responses || !survey || !survey.questions) {
    return {};
  }
  
  const summary = {};
  
  survey.questions.forEach(question => {
    // Get all answers for this question
    const answers = responses
      .filter(response => response.answers && response.answers.length > 0)
      .flatMap(response => response.answers)
      .filter(answer => answer.questionId.toString() === question._id.toString())
      .map(answer => answer.value);
    
    let questionSummary = {
      questionId: question._id,
      questionText: question.text,
      questionType: question.type,
      totalResponses: answers.length
    };
    
    // Generate different statistics based on question type
    switch (question.type) {
      case 'rating':
        // For rating questions, calculate numeric statistics
        questionSummary.stats = calculateStats(answers);
        questionSummary.frequency = calculateFrequency(answers);
        break;
      
      case 'yesno':
        // For yes/no questions, calculate frequency
        questionSummary.frequency = calculateFrequency(answers);
        questionSummary.yesPercentage = (answers.filter(a => a.toLowerCase() === 'sí' || a.toLowerCase() === 'si').length / answers.length) * 100 || 0;
        questionSummary.noPercentage = (answers.filter(a => a.toLowerCase() === 'no').length / answers.length) * 100 || 0;
        break;
      
      case 'single':
      case 'multiple':
        // For choice questions, calculate frequency of each option
        questionSummary.frequency = calculateFrequency(answers);
        break;
      
      case 'open':
        // For open-ended questions, just store the responses
        questionSummary.responses = answers;
        break;
    }
    
    summary[question._id.toString()] = questionSummary;
  });
  
  return summary;
};

module.exports = {
  calculateStats,
  calculateFrequency,
  generateResponseSummary
};
