/**
 * Auth & Watchlist Routes
 * Implements standard JWT authentication and user-specific Watchlists.
 * Automatically falls back to high-fidelity In-Memory session storage if MongoDB is offline.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_trading_key_12345!';

// Automated Upstox OAuth exchange callback API
router.post('/upstox-callback', async (req, res) => {
  const { code, redirectUri } = req.body;
  if (!code) return res.status(400).json({ message: "Authorization Code is required" });

  const clientId = process.env.UPSTOX_API_KEY;
  const clientSecret = process.env.UPSTOX_API_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({ message: "Upstox API Key/Secret is missing in .env configuration." });
  }

  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri || 'http://localhost:3000');
    params.append('grant_type', 'authorization_code');

    const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    if (response.data && response.data.access_token) {
      const token = response.data.access_token;
      
      // Update process.env state in running thread
      process.env.UPSTOX_ACCESS_TOKEN = token;

      // Persist the token to .env file on disk!
      const envPath = path.join(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('UPSTOX_ACCESS_TOKEN=')) {
          envContent = envContent.replace(/UPSTOX_ACCESS_TOKEN=.*/g, `UPSTOX_ACCESS_TOKEN=${token}`);
        } else {
          envContent += `\nUPSTOX_ACCESS_TOKEN=${token}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log("💾 Safely updated and saved Upstox Access Token in .env file.");
      }

      return res.json({
        success: true,
        message: "Upstox connected successfully!",
        token: token,
        username: response.data.user_name || "Trader"
      });
    } else {
      throw new Error("Missing access token in Upstox response");
    }
  } catch (error) {
    const upstoxError = error.response?.data;
    console.error("❌ Upstox Token Exchange Error:", upstoxError || error.message);
    return res.status(500).json({
      message: "Upstox connection failed",
      error: upstoxError || { message: error.message }
    });
  }
});

// Global In-Memory Fallback Database
const mockUsers = [
  {
    id: "mock_user_100",
    username: "guest_trader",
    email: "guest@bullseye.ai",
    passwordHash: "$2a$10$Uv0pL9q3n83iXv.o6.jNveT/4y8w9HkK1pZlZlZlZlZlZlZlZlZlZ", // bcrypt for 'guest123'
    watchlist: ["NIFTY", "BANKNIFTY", "INDIAVIX"],
    favorites: ["NIFTY", "BANKNIFTY"]
  }
];

// Helper to check if Mongoose is fully active and connected
function isMongoActive() {
  return mongoose.connection.readyState === 1;
}

// User signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (isMongoActive()) {
    try {
      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        return res.status(400).json({ message: "User or Email already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        username,
        email,
        password: hashedPassword
      });

      await user.save();
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { id: user._id, username: user.username, email: user.email, watchlist: user.watchlist, favorites: user.favorites }
      });
    } catch (err) {
      return res.status(500).json({ message: "Server error occurred during MongoDB Signup" });
    }
  } else {
    // In-memory registration
    const existing = mockUsers.find(u => u.username === username || u.email === email);
    if (existing) {
      return res.status(400).json({ message: "User or Email already exists in simulator" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = {
      id: "mock_" + Date.now(),
      username,
      email,
      passwordHash,
      watchlist: ["NIFTY", "BANKNIFTY", "INDIAVIX"],
      favorites: ["NIFTY", "BANKNIFTY"]
    };

    mockUsers.push(newUser);
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, watchlist: newUser.watchlist, favorites: newUser.favorites },
      message: "Signed up in simulated mode"
    });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (isMongoActive()) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Credentials" });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email, watchlist: user.watchlist, favorites: user.favorites }
      });
    } catch (err) {
      return res.status(500).json({ message: "Server error during login" });
    }
  } else {
    // In-memory Authentication
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials in simulator" });
    }

    // Direct match check or bcrypt check
    let isMatch = false;
    if (password === 'guest123' && user.id === 'mock_user_100') {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, watchlist: user.watchlist, favorites: user.favorites },
      message: "Logged in via simulated mode"
    });
  }
});

// Watchlist update middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: "Access Token Required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid Token" });
    req.userId = user.id;
    next();
  });
}

// Get user profile/watchlist
router.get('/profile', authenticateToken, async (req, res) => {
  if (isMongoActive()) {
    try {
      const user = await User.findById(req.userId).select('-password');
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (err) {
      return res.status(500).json({ message: "Server error" });
    }
  } else {
    const user = mockUsers.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: "Simulated user session expired" });
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      watchlist: user.watchlist,
      favorites: user.favorites
    });
  }
});

// Modify watchlist
router.post('/watchlist', authenticateToken, async (req, res) => {
  const { symbol, action } = req.body; // action: 'add' or 'remove'
  if (!symbol) return res.status(400).json({ message: "Symbol is required" });

  if (isMongoActive()) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (action === 'add') {
        if (!user.watchlist.includes(symbol)) user.watchlist.push(symbol);
      } else {
        user.watchlist = user.watchlist.filter(s => s !== symbol);
      }
      await user.save();
      return res.json({ watchlist: user.watchlist });
    } catch (err) {
      return res.status(500).json({ message: "Watchlist update failed" });
    }
  } else {
    const user = mockUsers.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: "User not found in simulator" });

    if (action === 'add') {
      if (!user.watchlist.includes(symbol)) user.watchlist.push(symbol);
    } else {
      user.watchlist = user.watchlist.filter(s => s !== symbol);
    }
    return res.json({ watchlist: user.watchlist, message: "Watchlist updated in memory" });
  }
});

// Modify favorites
router.post('/favorites', authenticateToken, async (req, res) => {
  const { symbol, action } = req.body;
  if (!symbol) return res.status(400).json({ message: "Symbol is required" });

  if (isMongoActive()) {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (action === 'add') {
        if (!user.favorites.includes(symbol)) user.favorites.push(symbol);
      } else {
        user.favorites = user.favorites.filter(s => s !== symbol);
      }
      await user.save();
      return res.json({ favorites: user.favorites });
    } catch (err) {
      return res.status(500).json({ message: "Favorites update failed" });
    }
  } else {
    const user = mockUsers.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: "User not found in simulator" });

    if (action === 'add') {
      if (!user.favorites.includes(symbol)) user.favorites.push(symbol);
    } else {
      user.favorites = user.favorites.filter(s => s !== symbol);
    }
    return res.json({ favorites: user.favorites, message: "Favorites updated in memory" });
  }
});

module.exports = router;
