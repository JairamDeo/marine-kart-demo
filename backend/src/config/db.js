const mongoose = require('mongoose');
const env = require('./env');

let connecting;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connecting) return connecting;

  connecting = mongoose
    .connect(env.mongodbUri)
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return conn.connection;
    })
    .catch((error) => {
      connecting = null;
      console.error('MongoDB connection error:', error.message);
      throw error;
    });

  return connecting;
};

module.exports = connectDB;
