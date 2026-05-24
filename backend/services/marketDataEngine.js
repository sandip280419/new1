/**
 * Live Market Data Simulation Engine
 * Simulates high-frequency ticks (1s) for NSE/BSE indices, stock quotes,
 * Option Chains, Greeks, FII/DII data, Market Breadth, and AI momentum metrics.
 */

const { generateOptionChain } = require('./optionChainCalc');
const axios = require('axios');

// Initial setup of Indices
const indicesData = {
  NIFTY: { name: "NIFTY 50", price: 23719.30, change: 64.60, changePct: 0.27, strikeStep: 50, ivStep: 14.5 },
  BANKNIFTY: { name: "BANK NIFTY", price: 54055.35, change: 615.95, changePct: 1.15, strikeStep: 100, ivStep: 16.2 },
  SENSEX: { name: "SENSEX", price: 75415.35, change: 231.99, changePct: 0.31, strikeStep: 100, ivStep: 13.8 },
  FINNIFTY: { name: "FINNIFTY", price: 21950.40, change: 45.30, changePct: 0.21, strikeStep: 50, ivStep: 15.0 },
  MIDCAP: { name: "NIFTY MIDCAP", price: 12280.30, change: 145.60, changePct: 1.21, strikeStep: 50, ivStep: 17.5 },
  SMALLCAP: { name: "NIFTY SMALLCAP", price: 16550.75, change: 255.40, changePct: 1.58, strikeStep: 50, ivStep: 19.2 },
  INDIAVIX: { name: "INDIA VIX", price: 17.91, change: -0.45, changePct: -2.45, strikeStep: 0, ivStep: 0 }
};

// ==========================================
// ZERODHA KITE CONNECT BACKGROUND FEEDER
// ==========================================
const ZERODHA_API_KEY = process.env.ZERODHA_API_KEY || '';
const ZERODHA_ACCESS_TOKEN = process.env.ZERODHA_ACCESS_TOKEN || '';

if (ZERODHA_API_KEY && ZERODHA_ACCESS_TOKEN) {
  console.log("🔌 Zerodha Kite Connect Feed: Active. Initializing background quotes query...");
  setInterval(async () => {
    try {
      const response = await axios.get(
        'https://api.kite.trade/quote?i=NSE:NIFTY+50&i=NSE:NIFTY+BANK&i=BSE:SENSEX&i=NSE:INDIA+VIX',
        {
          headers: {
            'Authorization': `token ${ZERODHA_API_KEY}:${ZERODHA_ACCESS_TOKEN}`
          },
          timeout: 900
        }
      );

      if (response.data && response.data.status === 'success') {
        const data = response.data.data;
        
        if (data['NSE:NIFTY 50']) {
          const q = data['NSE:NIFTY 50'];
          indicesData.NIFTY.price = q.last_price;
          indicesData.NIFTY.change = q.last_price - q.ohlc.close;
          indicesData.NIFTY.changePct = q.change;
        }

        if (data['NSE:NIFTY BANK']) {
          const q = data['NSE:NIFTY BANK'];
          indicesData.BANKNIFTY.price = q.last_price;
          indicesData.BANKNIFTY.change = q.last_price - q.ohlc.close;
          indicesData.BANKNIFTY.changePct = q.change;
        }

        if (data['BSE:SENSEX']) {
          const q = data['BSE:SENSEX'];
          indicesData.SENSEX.price = q.last_price;
          indicesData.SENSEX.change = q.last_price - q.ohlc.close;
          indicesData.SENSEX.changePct = q.change;
        }

        if (data['NSE:INDIA VIX']) {
          const q = data['NSE:INDIA VIX'];
          indicesData.INDIAVIX.price = q.last_price;
          indicesData.INDIAVIX.change = q.last_price - q.ohlc.close;
          indicesData.INDIAVIX.changePct = q.change;
        }
      }
    } catch (error) {
      // Suppress spamming logs, print single summary
      console.log(`⚠️ Zerodha Kite Feed query tick bypassed: ${error.message}`);
    }
  }, 1000);
}

// ==========================================
// ==========================================
// UPSTOX API BACKGROUND FEEDER (FREE!)
// ==========================================
setInterval(async () => {
  const currentToken = process.env.UPSTOX_ACCESS_TOKEN || '';
  if (!currentToken) return; // Skip silently if no token is saved yet

  try {
    const response = await axios.get(
      'https://api.upstox.com/v2/market-quote/quotes?instrument_key=NSE_INDEX%7CNifty%2050,NSE_INDEX%7CNifty%20Bank,NSE_INDEX%7CIndia%20VIX',
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        timeout: 900
      }
    );

    if (response.data && response.data.status === 'success') {
      const data = response.data.data;
      
      if (data['NSE_INDEX:Nifty 50']) {
        const q = data['NSE_INDEX:Nifty 50'];
        indicesData.NIFTY.price = q.last_price;
        indicesData.NIFTY.change = q.last_price - q.ohlc.close;
        indicesData.NIFTY.changePct = q.change;
      }

      if (data['NSE_INDEX:Nifty Bank']) {
        const q = data['NSE_INDEX:Nifty Bank'];
        indicesData.BANKNIFTY.price = q.last_price;
        indicesData.BANKNIFTY.change = q.last_price - q.ohlc.close;
        indicesData.BANKNIFTY.changePct = q.change;
      }

      if (data['NSE_INDEX:India VIX']) {
        const q = data['NSE_INDEX:India VIX'];
        indicesData.INDIAVIX.price = q.last_price;
        indicesData.INDIAVIX.change = q.last_price - q.ohlc.close;
        indicesData.INDIAVIX.changePct = q.change;
      }
    }
  } catch (error) {
    console.log(`⚠️ Upstox Live Feed query tick bypassed: ${error.message}`);
  }
}, 1000);

// Global Market Overview
const globalMarkets = {
  SPX: { name: "S&P 500", price: 5304.72, changePct: 0.12 },
  IXIC: { name: "NASDAQ", price: 16920.79, changePct: 0.32 },
  FTSE: { name: "FTSE 100", price: 8317.59, changePct: -0.26 },
  N225: { name: "NIKKEI 225", price: 38645.10, changePct: -0.42 },
  HSI: { name: "HANG SENG", price: 18608.94, changePct: 1.17 }
};

// Commodities & Currency
const correlationData = {
  USDINR: { name: "USD / INR", price: 83.2850, change: 0.0450, changePct: 0.05, status: "stable" },
  GOLD: { name: "GOLD (10g)", price: 72450, change: 180, changePct: 0.25, status: "bullish" }
};

// Sector Strength Mock
const sectors = [
  { name: "Nifty PSU Bank", strength: 82, trend: "Bullish", color: "#10b981" },
  { name: "Nifty IT", strength: 41, trend: "Neutral", color: "#f59e0b" },
  { name: "Nifty Auto", strength: 74, trend: "Bullish", color: "#10b981" },
  { name: "Nifty FMCG", strength: 32, trend: "Bearish", color: "#ef4444" },
  { name: "Nifty Metal", strength: 68, trend: "Bullish", color: "#10b981" },
  { name: "Nifty Pharma", strength: 55, trend: "Neutral", color: "#f59e0b" },
  { name: "Nifty Financial Services", strength: 48, trend: "Neutral", color: "#f59e0b" }
];

// FII & DII flows
const fiiDiiData = {
  fiiNet: 1420.50, // Cr.
  diiNet: 890.30,  // Cr.
  totalNet: 2310.80,
  historical: [
    { date: "2026-05-22", fii: 1250.40, dii: 640.20 },
    { date: "2026-05-21", fii: -840.10, dii: 1120.50 },
    { date: "2026-05-20", fii: -1210.00, dii: 1450.80 },
    { date: "2026-05-19", fii: 430.60, dii: 220.10 },
    { date: "2026-05-18", fii: 910.80, dii: -120.40 }
  ]
};

// Top Gainers & Losers
const topGainers = [
  { symbol: "TATASTEEL", price: 174.20, changePct: 4.82, volume: 15400000 },
  { symbol: "M&M", price: 2510.50, changePct: 3.91, volume: 4800000 },
  { symbol: "ADANIPORTS", price: 1435.80, changePct: 3.25, volume: 7200000 },
  { symbol: "POWERGRID", price: 325.40, changePct: 2.88, volume: 8900000 },
  { symbol: "SBIN", price: 832.10, changePct: 2.54, volume: 12400000 }
];

const topLosers = [
  { symbol: "ITC", price: 428.50, changePct: -2.85, volume: 11400000 },
  { symbol: "HDFCBANK", price: 1520.15, changePct: -1.95, volume: 18900000 },
  { symbol: "HCLTECH", price: 1315.40, changePct: -1.62, volume: 3800000 },
  { symbol: "SUNPHARMA", price: 1460.20, changePct: -1.45, volume: 2900000 },
  { symbol: "INFY", price: 1445.80, changePct: -1.18, volume: 6400000 }
];

// Economic Calendar Static Mock
const economicCalendar = [
  { id: 1, time: "2026-05-25 17:30", event: "India Infrastructure Output (YoY)", impact: "High", actual: "--", forecast: "5.2%", previous: "6.2%" },
  { id: 2, time: "2026-05-27 18:00", event: "US GDP Growth Rate Q1 (Prelim)", impact: "High", actual: "--", forecast: "1.6%", previous: "1.3%" },
  { id: 3, time: "2026-05-29 17:30", event: "India GDP Growth Rate (YoY) Q4", impact: "Critical", actual: "--", forecast: "6.8%", previous: "8.4%" },
  { id: 4, time: "2026-05-30 02:00", event: "US PCE Price Index (MoM)", impact: "High", actual: "--", forecast: "0.2%", previous: "0.3%" }
];

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 100 + minute;
  return timeVal >= 915 && timeVal <= 1530; // 9:15 AM to 3:30 PM
}

// Support and Resistance calculation generator (mock but realistic)
function calculateSRLevels(spotPrice, strikeStep) {
  const r1 = Math.round((spotPrice * 1.008) / 10) * 10;
  const r2 = Math.round((spotPrice * 1.018) / 10) * 10;
  const s1 = Math.round((spotPrice * 0.992) / 10) * 10;
  const s2 = Math.round((spotPrice * 0.982) / 10) * 10;
  return {
    resistances: [r1, r2],
    supports: [s1, s2]
  };
}

// Generates dynamic AI Quantitative Signals for any active index
function generateSignalForIndex(key, indexData, chainData) {
  const pcr = chainData.pcr;
  const changePct = indexData.changePct;
  const sr = calculateSRLevels(indexData.price, indexData.strikeStep);

  let signal = "AVOID TRADE";
  let confidence = 50;
  let reason = `${indexData.name} is in a sideways consolidation range.`;

  if (changePct > 0.35 && pcr > 1.05) {
    signal = "CE BUY";
    confidence = Math.min(95, Math.round(70 + changePct * 12));
    reason = `${indexData.name} momentum is strongly bullish. PCR suggests high put writing support.`;
  } else if (changePct < -0.35 && pcr < 0.85) {
    signal = "PE BUY";
    confidence = Math.min(95, Math.round(72 - changePct * 12));
    reason = `${indexData.name} price action broke local support. Heavy call writing seen ATM.`;
  } else if (Math.abs(changePct) < 0.15) {
    signal = "AVOID TRADE";
    confidence = 80;
    reason = `${indexData.name} is consolidating near spot. High option theta decay expected; preserve capital.`;
  }

  return {
    signal,
    confidence,
    reason,
    pcr,
    callOIStrike: chainData.highestCallOIStrike,
    putOIStrike: chainData.highestPutOIStrike,
    support: sr.supports,
    resistance: sr.resistances,
    smartMoneyFlow: changePct > 0.2 ? "INFLOW" : (changePct < -0.2 ? "OUTFLOW" : "NEUTRAL")
  };
}


/**
 * Updates the state of all market data by simulating small ticks
 */
function tickMarketData() {
  const shouldFreeze = !isMarketOpen();

  // Fluctuate India VIX slightly
  const vix = indicesData.INDIAVIX;
  if (!shouldFreeze) {
    vix.price = Math.max(10.50, Math.min(25.00, parseFloat((vix.price + (Math.random() - 0.5) * 0.15).toFixed(2))));
  }
  
  // Update other indices
  Object.keys(indicesData).forEach(key => {
    if (key === 'INDIAVIX') return;
    const index = indicesData[key];
    
    if (shouldFreeze) return; // Freeze prices if live feed is active but market is closed!
    
    // Simulate trend (Nifty 50 has a slight upward bias, Bank Nifty is bearish in initial state)
    let bias = 0.02;
    if (key === 'BANKNIFTY') bias = -0.03;
    
    const pctChange = (Math.random() - 0.48 + bias) * 0.08; // small percentage change
    const delta = index.price * pctChange / 100;
    index.price = parseFloat((index.price + delta).toFixed(2));
    
    // Recalculate daily change
    index.change = parseFloat((index.change + delta).toFixed(2));
    index.changePct = parseFloat(((index.change / (index.price - index.change)) * 100).toFixed(2));
  });

  // USDINR and Gold Correlation
  // If VIX spikes, gold should increase (safe haven demand) and USDINR depreciates
  const vixFactor = (vix.price - 13.0) / 10;
  const usdinr = correlationData.USDINR;
  usdinr.price = parseFloat((83.25 + vixFactor * 0.1 + (Math.random() - 0.5) * 0.01).toFixed(4));
  usdinr.change = parseFloat((usdinr.price - 83.21).toFixed(4));
  usdinr.changePct = parseFloat(((usdinr.change / 83.21) * 100).toFixed(2));

  const gold = correlationData.GOLD;
  gold.price = Math.round(72300 + vixFactor * 600 + (Math.random() - 0.5) * 80);
  gold.change = gold.price - 72100;
  gold.changePct = parseFloat(((gold.change / 72100) * 100).toFixed(2));

  // Fluctuate sector strengths
  sectors.forEach(s => {
    s.strength = Math.max(10, Math.min(99, Math.round(s.strength + (Math.random() - 0.5) * 3)));
    s.trend = s.strength > 65 ? "Bullish" : (s.strength < 40 ? "Bearish" : "Sideways");
    s.color = s.strength > 65 ? "#10b981" : (s.strength < 40 ? "#ef4444" : "#f59e0b");
  });

  // Calculate Market Breadth (Percentage of rising stocks vs falling stocks)
  // Let's tie it to Nifty percentage change
  const niftyChange = indicesData.NIFTY.changePct;
  const advances = Math.max(10, Math.min(90, Math.round(50 + niftyChange * 15 + (Math.random() - 0.5) * 4)));
  const declines = 100 - advances;

  // Generate real-time option chains and AI signals dynamically for all active indices
  const optionChains = {};
  const signals = {};

  Object.keys(indicesData).forEach(key => {
    if (key === 'INDIAVIX') return;
    const index = indicesData[key];
    const chain = generateOptionChain(index.price, index.strikeStep, vix.price, 8);
    optionChains[key] = chain;
    signals[key.toLowerCase()] = generateSignalForIndex(key, index, chain);
  });

  // Fear & Greed index estimation
  const fearGreedScore = Math.max(5, Math.min(95, Math.round(55 + (indicesData.NIFTY.changePct * 8) - (vix.price - 14) * 2)));

  // Global mood
  let marketMood = "Sideways";
  if (indicesData.NIFTY.changePct > 0.6) marketMood = "Bullish";
  else if (indicesData.NIFTY.changePct < -0.6) marketMood = "Bearish";

  // Trigger breakout alerts occasionally (random logic for simulation value)
  let alertMessage = null;
  if (Math.random() > 0.92) {
    const isBullish = Math.random() > 0.4;
    const value = Math.round(indicesData.NIFTY.price);
    alertMessage = {
      timestamp: new Date().toLocaleTimeString(),
      index: "NIFTY 50",
      type: isBullish ? "Breakout" : "Breakdown",
      message: isBullish 
        ? `NIFTY spiked above local resistance at ${value}. High volume buyer flow observed!` 
        : `NIFTY slipped below local support at ${value}. Sell order blocks executed!`,
      channel: Math.random() > 0.5 ? "Telegram" : "WhatsApp"
    };
  }

  return {
    indices: indicesData,
    global: globalMarkets,
    correlations: correlationData,
    sectors,
    breadth: { advances, declines },
    fiiDii: fiiDiiData,
    gainers: topGainers,
    losers: topLosers,
    calendar: economicCalendar,
    fearGreed: { score: fearGreedScore, label: fearGreedScore > 75 ? "Extreme Greed" : (fearGreedScore > 55 ? "Greed" : (fearGreedScore < 25 ? "Extreme Fear" : (fearGreedScore < 45 ? "Fear" : "Neutral"))) },
    mood: marketMood,
    alerts: alertMessage,
    // Keep top-level keys for backward-compatibility
    niftyOptionChain: optionChains.NIFTY,
    bankNiftyOptionChain: optionChains.BANKNIFTY,
    optionChains,
    signals
  };
}

module.exports = {
  tickMarketData
};
