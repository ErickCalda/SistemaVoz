const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection String from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://joseporozocaicedo:joseporozo2002@joseporozo.r7bfl.mongodb.net/apipersonal';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    // Replace the password placeholder with the actual password from env vars
    const connectionString = MONGODB_URI.replace('<joseporozo2002>', process.env.MONGODB_PASSWORD || '');
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
