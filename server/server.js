const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ===== GLOBAL ERROR CATCH (IMPORTANT FOR YOUR JOIN ERROR) =====
process.on('uncaughtException', (err) => {
  console.log("🔥 UNCAUGHT EXCEPTION:");
  console.log(err);
});

process.on('unhandledRejection', (err) => {
  console.log("🔥 UNHANDLED REJECTION:");
  console.log(err);
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== DEBUG =====
console.log("🚀 SERVER STARTING...");
console.log("MONGO_URI EXISTS:", !!process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);

// ===== ROUTES =====
console.log("LOADING AUTH ROUTES...");
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
console.log("AUTH ROUTES LOADED");

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ===== MONGO CHECK =====
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI missing');
  process.exit(1);
}

// ===== CONNECT MONGODB =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
  });

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});