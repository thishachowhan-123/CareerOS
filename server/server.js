const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ===== DEBUG =====
console.log("🚀 SERVER STARTING...");
console.log("MONGO RAW:", JSON.stringify(process.env.MONGO_URI));
console.log("PORT:", process.env.PORT);

// ===== GLOBAL ERROR HANDLERS =====
process.on('uncaughtException', (err) => {
  console.log("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on('unhandledRejection', (err) => {
  console.log("🔥 UNHANDLED REJECTION:", err);
});

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== ROUTES =====
console.log("LOADING AUTH ROUTES...");
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
console.log("AUTH ROUTES LOADED");

// ===== HEALTH =====
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ===== MONGO CHECK =====
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI missing');
}

// ===== CONNECT MONGO (ONLY ONCE) =====
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err.message));

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});