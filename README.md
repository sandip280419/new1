# 🐂 Bullseye Trading AI // Quantitative Stock Analysis Dashboard

Bullseye Trading AI is a professional, premium-grade Indian stock market analysis dashboard with an ultra-sleek, responsive **dark terminal glassmorphism UI** (resembling a blend of Zerodha Streak, Sensibull, and TradingView).

---

## 🌟 Key Features

1. **High-Frequency WebSocket Stream**: Real-time mock data feed updating index and option chain metrics every **1 second**.
2. **Derivative Greeks Estimator**: Approximates Black-Scholes **Delta** and **Gamma** for Calls and Puts based on spot fluctuations, strike distances, and VIX skews.
3. **AI Quantitative momentum Signals**: Leverages **Google Gemini AI** to detect intraday momentum, suggest actions (`CE BUY`, `PE BUY`, `AVOID TRADE`), and define stoploss/target zones.
4. **Interactive Charting Suite**: Integrates live **TradingView Widgets** with multi-timeframes alongside a custom real-time SVG candlestick overlay chart with indicators (EMA, RSI, MACD, VWAP).
5. **AI Chat Assistant**: A conversant side panel answering queries like *"Should I buy CE or PE now?"* or *"What is Bank Nifty trend?"* using real-time market data.
6. **Market Sentiment gauges**: Advances-vs-declines, sector strengths, and a visual **Fear & Greed index**.
7. **Backtesting & Risk calculators**: Run simple moving average crossovers and determine optimized position sizes based on capital targets.
8. **Integrations Ready**: Adapter patterns are in place to replace simulated streams with production APIs from **Dhan**, **Upstox**, or **Angel One** via `.env` adjustments.

---

## 🏗️ Architecture Layout

```
bullseye-trading-ai/
├── backend/                  # Node.js + Express + WS Server
│   ├── config/               # Database and environment loader
│   ├── models/               # User watchlist schemas (Mongoose)
│   ├── routes/               # REST controllers (Auth, Watchlists, AI chat)
│   ├── services/             # Live generator, Greeks math, Gemini connectors
│   ├── server.js             # Main server bootstrap
│   └── package.json
└── frontend/                 # React + Vite Client
    ├── src/
    │   ├── components/       # UI Dashboard components (Ticker, OptionChain, AI chat)
    │   ├── styles/           # Premium Glassmorphism index.css
    │   └── App.jsx           # App state organizer
    ├── index.html
    └── package.json
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18+) & **npm** installed on your system.
* **MongoDB** (Optional, falls back to a robust simulated in-memory storage if offline).

### 1. Launch Backend Server
Open your system terminal and navigate to `/backend`:
```bash
cd backend
npm install
npm run dev
```
*The server will boot on http://localhost:5000 and establish a live WebSocket pipeline.*

### 2. Launch Frontend Client
Open a second terminal window and navigate to `/frontend`:
```bash
cd frontend
npm install
npm run dev
```
*The client will boot on http://localhost:3000.*

---

## ⚙️ Advanced Configuration (`.env`)

Inside `backend/.env` you can configure optional tokens:

```env
# Google Gemini Key (enables actual AI predictions, otherwise falls back to smart local quant templates)
GEMINI_API_KEY=your_gemini_api_token_here

# Connects to your MongoDB (otherwise falls back to fully simulated user arrays)
MONGO_URI=mongodb://127.0.0.1:27017/bullseye_trading
```

### 🔌 Live Indian Broker Integration
To swap mock data for live market updates, the adapter in `backend/services/marketDataEngine.js` can be customized using broker APIs:
* **Upstox API**: Register on developer.upstox.com and obtain Client Key/Secret.
* **Dhan API**: Request Access Token directly under Dhan App Settings.
* **Angel One**: Sign up on smartapi.angelone.in for interactive stock sockets.

---

## 🛡️ User Authentication Demonstration

When you open the login page, you can choose to register a new account OR click the **⚡ Instant Guest Demo Mode** button. This bypasses form requirements and lets you explore the dashboard with a preloaded sample trader profile!
