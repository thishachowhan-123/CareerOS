require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRE: '7d',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/careeros'
};
