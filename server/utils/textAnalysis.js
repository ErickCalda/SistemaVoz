/**
 * Utility functions for text analysis using compromise.js
 */
const nlp = require('compromise');

/**
 * Analyze sentiment of text
 * @param {string} text - The text to analyze
 * @returns {Object} Sentiment analysis results
 */
const analyzeSentiment = (text) => {
  try {
    const doc = nlp(text);
    
    // Basic sentiment analysis
    const positiveWords = doc.match('(bueno|excelente|genial|increíble|fantástico|maravilloso|feliz|satisfecho|encantado|útil|fácil|recomendaría)').length;
    const negativeWords = doc.match('(malo|pobre|terrible|horrible|decepcionante|infeliz|insatisfecho|difícil|complicado|confuso|lento|no recomendaría)').length;
    
    const total = positiveWords + negativeWords;
    
    // Calculate sentiment score between -1 and 1
    const score = total > 0 ? (positiveWords - negativeWords) / total : 0;
    
    let sentiment = 'neutral';
    if (score > 0.2) sentiment = 'positive';
    if (score < -0.2) sentiment = 'negative';
    
    return {
      score,
      sentiment,
      details: {
        positive: positiveWords,
        negative: negativeWords
      }
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { score: 0, sentiment: 'neutral', details: { positive: 0, negative: 0 } };
  }
};

/**
 * Extract keywords from text
 * @param {string} text - The text to analyze
 * @param {number} limit - Maximum number of keywords to return
 * @returns {Array} Extracted keywords
 */
const extractKeywords = (text, limit = 10) => {
  try {
    const doc = nlp(text);
    
    // Get nouns as keywords
    const nouns = doc.nouns().out('array');
    
    // Filter out duplicates and short words
    const filteredNouns = [...new Set(nouns)].filter(word => word.length > 3);
    
    // Return top keywords
    return filteredNouns.slice(0, limit);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    return [];
  }
};

/**
 * Categorize text based on predefined categories
 * @param {string} text - The text to categorize
 * @param {Array} categories - Array of category objects with name and keywords
 * @returns {Array} Matched categories
 */
const categorizeText = (text, categories) => {
  try {
    const doc = nlp(text.toLowerCase());
    const matchedCategories = [];
    
    categories.forEach(category => {
      // Check if any of the category keywords are in the text
      const keywordPattern = category.keywords.join('|');
      const matches = doc.match(keywordPattern);
      
      if (matches.length > 0) {
        matchedCategories.push({
          name: category.name,
          score: matches.length / doc.wordCount()
        });
      }
    });
    
    // Sort by score descending
    return matchedCategories.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error categorizing text:', error);
    return [];
  }
};

module.exports = {
  analyzeSentiment,
  extractKeywords,
  categorizeText
};
