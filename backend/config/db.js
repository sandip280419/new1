/**
 * MongoDB database configuration.
 * Safely handles connection errors and logs fallback database modes.
 */

const mongoose = require('mongoose');

let isConnected = false;
let useInMemoryDb = false;

async function connectDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bullseye_trading';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000 // fail fast if not running
    });
    isConnected = true;
    useInMemoryDb = false;
    console.log('💚 MongoDB Connected successfully.');
  } catch (error) {
    isConnected = false;
    useInMemoryDb = true;
    console.log('⚠️ MongoDB connection failed. Falling back to robust in-memory database simulation.');
  }
}

function getDbStatus() {
  return {
    connected: isConnected,
    mode: useInMemoryDb ? 'In-Memory Simulator' : 'MongoDB Production'
  };
}

module.exports = {
  connectDB,
  getDbStatus
};
