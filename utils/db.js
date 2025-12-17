const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // If no MongoDB URI is provided or it's clearly invalid, run in "dummy" mode so the app can start.
  const isValidUri =
    typeof uri === 'string' &&
    (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'));

  if (!isValidUri) {
    console.warn(
      'MONGODB_URI missing or invalid – running in dummy mode with NO database connection.'
    );
    return;
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
