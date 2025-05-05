const admin = require('firebase-admin');
const { initializeFirebaseAdmin } = require('../config/firebase-config');

// Asegurarse de que Firebase Admin SDK está inicializado
initializeFirebaseAdmin();

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(403).json({ message: 'Token de autenticación no válido' });
  }
};

module.exports = { verifyToken };
