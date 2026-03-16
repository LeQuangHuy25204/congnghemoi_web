const mongoose = require('mongoose');

const DEFAULT_MONGO_URL = 'mongodb://127.0.0.1:27017/ecommerce-system';

const connectToMongo = async (mongoUrl = DEFAULT_MONGO_URL) => {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(mongoUrl, {
      autoIndex: false,
      serverSelectionTimeoutMS: 5000,
    });
    // eslint-disable-next-line no-console
    console.log(`[db] Connected to MongoDB: ${mongoUrl}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[db] MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = {
  connectToMongo,
  DEFAULT_MONGO_URL,
};
