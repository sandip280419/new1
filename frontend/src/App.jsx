import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, LogIn, UserPlus, LogOut, CheckCircle, Wifi, Play, Heart } from 'lucide-react';
import TickerTape from './components/TickerTape';
import IndicesSelector from './components/IndicesSelector';
import OptionChain from './components/OptionChain';
import TradingViewChart from './components/TradingViewChart';
import MarketBreadth from './components/MarketBreadth';
import AiInsights from './components/AiInsights';
import AiChatAssistant from './components/AiChatAssistant';
import BacktestingPanel from './components/BacktestingPanel';
import AlertManager from './components/AlertManager';
import MobileView from './components/MobileView';


// ==========================================
// CLIENT-SIDE MOCK MARKET DATA SIMULATOR FALLBACK
// (Runs directly in the browser if the backend server is offline!)
// ==========================================

function stdNormalCDF(x) {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
  const d = 0.39894228 * Math.exp(-x * x / 2.0);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1.0 - p : p;
}

function stdNormalPDF(x) {
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);
}

function clientCalculateGreeks(S, K, T, r, v) {
  if (T <= 0 || v <= 0 || S <= 0 || K <= 0) {
    return { callDelta: S > K ? 1.0 : 0.0, putDelta: S < K ? -1.0 : 0.0, gamma: 0.0 };
  }
  const d1 = (Math.log(S / K) + (r + (v * v) / 2.0) * T) / (v * Math.sqrt(T));
  const callDelta = stdNormalCDF(d1);
  const putDelta = callDelta - 1.0;
  const pdfD1 = stdNormalPDF(d1);
  const gamma = pdfD1 / (S * v * Math.sqrt(T));
  return {
    callDelta: parseFloat(callDelta.toFixed(3)),
    putDelta: parseFloat(putDelta.toFixed(3)),
    gamma: parseFloat(gamma.toFixed(5))
  };
}

function clientGenerateOptionChain(spotPrice, strikeStep, vix, numStrikes = 8) {
  const atmStrike = Math.round(spotPrice / strikeStep) * strikeStep;
  const strikes = [];
  const ivBase = vix / 100.0;
  const t = 4.0 / 365.0;
  const r = 0.07;

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = atmStrike + (i * strikeStep);
    const distanceFactor = Math.abs(strike - spotPrice) / spotPrice;
    const iv = ivBase + (distanceFactor * distanceFactor * 0.4); 

    const intrinsicCall = Math.max(0, spotPrice - strike);
    const intrinsicPut = Math.max(0, strike - spotPrice);
    const extrinsic = spotPrice * iv * Math.sqrt(t) * (1.0 - distanceFactor * 1.5);
    
    const callPrice = Math.max(1.0, parseFloat((intrinsicCall + extrinsic).toFixed(2)));
    const putPrice = Math.max(1.0, parseFloat((intrinsicPut + extrinsic).toFixed(2)));
    const greeks = clientCalculateGreeks(spotPrice, strike, t, r, iv);

    const oiBase = Math.floor(Math.exp(-Math.pow(strike - atmStrike, 2) / Math.pow(strikeStep * 4, 2)) * 1200000);
    const callOI = Math.max(5000, Math.floor(oiBase * (i < 0 ? 0.3 : 1.2) + Math.random() * 5000));
    const putOI = Math.max(5000, Math.floor(oiBase * (i > 0 ? 0.3 : 1.2) + Math.random() * 5000));

    strikes.push({
      strike,
      call: { price: callPrice, change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)), volume: Math.floor(callOI * 0.9), oi: callOI, gamma: greeks.gamma, delta: greeks.callDelta },
      put: { price: putPrice, change: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)), volume: Math.floor(putOI * 0.9), oi: putOI, gamma: greeks.gamma, delta: greeks.putDelta }
    });
  }

  let totalCallOI = 0, totalPutOI = 0, highestCallOIStrike = strikes[0].strike, highestPutOIStrike = strikes[0].strike;
  let maxCallOI = 0, maxPutOI = 0;

  strikes.forEach(s => {
    totalCallOI += s.call.oi;
    totalPutOI += s.put.oi;
    if (s.call.oi > maxCallOI) { maxCallOI = s.call.oi; highestCallOIStrike = s.strike; }
    if (s.put.oi > maxPutOI) { maxPutOI = s.put.oi; highestPutOIStrike = s.strike; }
  });

  return { strikes, pcr: parseFloat((totalPutOI / Math.max(1, totalCallOI)).toFixed(2)), totalCallOI, totalPutOI, highestCallOIStrike, highestPutOIStrike, atmStrike };
}

function isMarketOpen() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return false;
  const hour = now.getHours();
  const minute = now.getMinutes();
  const timeVal = hour * 100 + minute;
  return timeVal >= 915 && timeVal <= 1530; // 9:15 AM to 3:30 PM
}

function generateLocalMarketData(currentData = null) {
  const base = currentData ? currentData.indices : {
    NIFTY: { name: "NIFTY 50", price: 23719.30, change: 64.60, changePct: 0.27, strikeStep: 50, ivStep: 14.5 },
    BANKNIFTY: { name: "BANK NIFTY", price: 54055.35, change: 615.95, changePct: 1.15, strikeStep: 100, ivStep: 16.2 },
    SENSEX: { name: "SENSEX", price: 75415.35, change: 231.99, changePct: 0.31, strikeStep: 100, ivStep: 13.8 },
    FINNIFTY: { name: "FINNIFTY", price: 21950.40, change: 45.30, changePct: 0.21, strikeStep: 50, ivStep: 15.0 },
    MIDCAP: { name: "NIFTY MIDCAP", price: 12280.30, change: 145.60, changePct: 1.21, strikeStep: 50, ivStep: 17.5 },
    SMALLCAP: { name: "NIFTY SMALLCAP", price: 16550.75, change: 255.40, changePct: 1.58, strikeStep: 50, ivStep: 19.2 },
    INDIAVIX: { name: "INDIA VIX", price: 17.91, change: -0.45, changePct: -2.45, strikeStep: 0, ivStep: 0 }
  };

  const shouldFreeze = !isMarketOpen();

  // Fluctuate values slightly
  const indices = {};
  Object.keys(base).forEach(key => {
    const idx = { ...base[key] };
    if (shouldFreeze) {
      indices[key] = idx; // Freeze prices completely on weekends/closed hours!
      return;
    }
    if (key === 'INDIAVIX') {
      idx.price = Math.max(10.5, Math.min(25.0, parseFloat((idx.price + (Math.random() - 0.5) * 0.1).toFixed(2))));
    } else {
      const bias = key === 'BANKNIFTY' ? -0.02 : 0.01;
      const change = (Math.random() - 0.48 + bias) * 0.05;
      const delta = idx.price * change / 100;
      idx.price = parseFloat((idx.price + delta).toFixed(2));
      idx.change = parseFloat((idx.change + delta).toFixed(2));
      idx.changePct = parseFloat(((idx.change / (idx.price - idx.change)) * 100).toFixed(2));
    }
    indices[key] = idx;
  });

  const vix = indices.INDIAVIX.price;
  const usdinr = { name: "USD / INR", price: parseFloat((83.25 + (vix - 13) * 0.05 + (Math.random() - 0.5) * 0.005).toFixed(4)), changePct: 0.05 };
  const gold = { name: "GOLD (10g)", price: Math.round(72300 + (vix - 13) * 400), changePct: 0.25 };

  const advances = Math.max(15, Math.min(85, Math.round(50 + indices.NIFTY.changePct * 12)));
  const declines = 100 - advances;

  const sectors = [
    { name: "Nifty PSU Bank", strength: Math.max(10, Math.min(99, 75 + Math.round((Math.random() - 0.5) * 4))), trend: "Bullish", color: "#10b981" },
    { name: "Nifty IT", strength: Math.max(10, Math.min(99, 45 + Math.round((Math.random() - 0.5) * 4))), trend: "Neutral", color: "#f59e0b" },
    { name: "Nifty Auto", strength: Math.max(10, Math.min(99, 70 + Math.round((Math.random() - 0.5) * 4))), trend: "Bullish", color: "#10b981" },
    { name: "Nifty FMCG", strength: Math.max(10, Math.min(99, 35 + Math.round((Math.random() - 0.5) * 4))), trend: "Bearish", color: "#ef4444" }
  ];

  const optionChains = {};
  const signals = {};

  const getSR = (spot, step) => ({
    supports: [Math.round((spot * 0.992) / 10) * 10, Math.round((spot * 0.982) / 10) * 10],
    resistances: [Math.round((spot * 1.008) / 10) * 10, Math.round((spot * 1.018) / 10) * 10]
  });

  Object.keys(indices).forEach(key => {
    if (key === 'INDIAVIX') return;
    const index = indices[key];
    const chain = clientGenerateOptionChain(index.price, index.strikeStep, vix, 8);
    optionChains[key] = chain;

    const changePct = index.changePct;
    const sr = getSR(index.price, index.strikeStep);
    const signal = changePct > 0.35 ? 'CE BUY' : (changePct < -0.35 ? 'PE BUY' : 'AVOID TRADE');

    signals[key.toLowerCase()] = {
      signal,
      confidence: signal === 'AVOID TRADE' ? 80 : Math.round(70 + Math.random() * 20),
      reason: signal === 'CE BUY' 
        ? `${index.name} exhibits breakout momentum with put writing support.` 
        : (signal === 'PE BUY' ? `Bearish distribution block active in ${index.name}. Call walls building ATM.` : `${index.name} consolidated in range. Heavy theta decay expected.`),
      pcr: chain.pcr || 1.0,
      callOIStrike: chain.highestCallOIStrike,
      putOIStrike: chain.highestPutOIStrike,
      support: sr.supports,
      resistance: sr.resistances,
      smartMoneyFlow: changePct > 0.15 ? "INFLOW" : "NEUTRAL"
    };
  });

  const fgScore = Math.max(5, Math.min(95, Math.round(55 + (indices.NIFTY.changePct * 10))));

  return {
    indices,
    correlations: { USDINR: usdinr, GOLD: gold },
    breadth: { advances, declines },
    sectors,
    fearGreed: { score: fgScore, label: fgScore > 70 ? "Greed" : (fgScore < 30 ? "Fear" : "Neutral") },
    mood: indices.NIFTY.changePct > 0.3 ? 'Bullish' : (indices.NIFTY.changePct < -0.3 ? 'Bearish' : 'Sideways'),
    niftyOptionChain: optionChains.NIFTY,
    bankNiftyOptionChain: optionChains.BANKNIFTY,
    optionChains,
    signals
  };
}

// Local chat quant rules advisor (returns instant AI answers client-side if server is down)
function getLocalChatResponse(queryText, currentSnapshot) {
  const query = queryText.toLowerCase();
  const nifty = currentSnapshot.indices.NIFTY;
  const signalNifty = currentSnapshot.signals.nifty;
  const atm = Math.round(nifty.price / 50) * 50;

  if (query.includes('ce') || query.includes('pe') || query.includes('call') || query.includes('put') || query.includes('buy')) {
    if (signalNifty.signal === 'CE BUY') {
      return `### 🐂 **AI Quant Call: Nifty CE Setup**

*   **Current Action**: **BUY NIFTY CALL OPTION (CE)**
*   **Confidence**: \`${signalNifty.confidence}%\`
*   **Strike Selection**: ATM \`${atm}\` or slightly ITM \`${atm - 50}\`
*   **Target Levels**: Target exit pivots at \`${signalNifty.resistance[0]}\` and \`${signalNifty.resistance[1]}\`
*   **Stop Loss Floor**: Exit trade immediately below support boundary \`${signalNifty.support[0]}\`
*   **Insight**: Volatility ticks are low, and buyer volume blocks suggest strong call accumulation.`;
    } else if (signalNifty.signal === 'PE BUY') {
      return `### 🐻 **AI Quant Call: Nifty PE Setup**

*   **Current Action**: **BUY NIFTY PUT OPTION (PE)**
*   **Confidence**: \`${signalNifty.confidence}%\`
*   **Strike Selection**: ATM \`${atm}\` or slightly ITM \`${atm + 50}\`
*   **Target Levels**: Targets set at support zones \`${signalNifty.support[0]}\` and \`${signalNifty.support[1]}\`
*   **Stop Loss Floor**: Exit trade immediately above resistance boundary \`${signalNifty.resistance[0]}\`
*   **Insight**: Heavy distribution seen. Large call writers blocking the upward boundary.`;
    } else {
      return `### 🛡️ **AI Quant Call: AVOID TRADE**

*   **Action**: **NO TRADE (Sideways Consolidation)**
*   **Confidence**: \`85%\`
*   **Stance**: Capital preservation mode.
*   **Insight**: Nifty is currently trading flat near \`${nifty.price}\` with no structural breakout. Wait for prices to break above \`${signalNifty.resistance[0]}\` or below \`${signalNifty.support[0]}\` before deploying option buyers' capital.`;
    }
  }

  if (query.includes('bank') || query.includes('banknifty') || query.includes('bank nifty')) {
    const bn = currentSnapshot.indices.BANKNIFTY;
    return `### 🏦 **Bank Nifty Live Trend Summary**

*   **Spot Price**: **${bn.price}** (${bn.changePct >= 0 ? '🟢' : '🔴'} **${bn.changePct}%**)
*   **Supports / Resistances**: Support at \`${currentSnapshot.signals.banknifty.support[0]}\`, Resistance at \`${currentSnapshot.signals.banknifty.resistance[0]}\`
*   **Quant Outlook**: Bank Nifty is currently consolidating under moving averages. Private banking volumes remain neutral. Best to wait for a 15-minute range breakout.`;
  }

  if (query.includes('strike') || query.includes('strike price') || query.includes('atm') || query.includes('otm')) {
    return `### 🎯 **Premium Strike Selection (Nifty 50)**

Based on dynamic Implied Volatility and OI walls:
1.  **Low-Risk Intraday (In-The-Money)**:
    *   **Calls (CE)**: \`${atm - 50}\` (Approx premium: ~₹125)
    *   **Puts (PE)**: \`${atm + 50}\` (Approx premium: ~₹118)
2.  **High-Speed Scalping (At-The-Money)**:
    *   **Strike**: \`${atm}\` (Maximum delta movement for quick momentum plays)
3.  **Put/Call Walls (Exp Threshold)**:
    *   **Floor (Put Wall)**: \`${signalNifty.putOIStrike}\` (Strong buyer presence)
    *   **Ceiling (Call Wall)**: \`${signalNifty.callOIStrike}\` (Strong seller boundary)`;
  }

  return `### 📈 **Bullseye AI Live Quant Digest**

*   **Index Trend**: Nifty is **${currentSnapshot.mood}** near **${nifty.price}**
*   **PCR Ratio**: \`${signalNifty.pcr}\`
*   **VIX Volatility**: \`${currentSnapshot.indices.INDIAVIX.price}\`
*   **Quant Idea**: Trade a simple Bull Call Spread or Bear Put Spread depending on indices boundary break. Ask me "Should I buy CE or PE now?" for scalp setups!`;
}

export default function App() {
  // Mobile route — show phone-optimized view at /mobile
  if (window.location.pathname === '/mobile') {
    return <MobileView />;
  }

  // Live WebSocket State Data
  const [marketData, setMarketData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeIndex, setActiveIndex] = useState('NIFTY');

  // User Session Management
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authError, setAuthError] = useState('');
  
  // Auth Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Watchlist states
  const [watchlist, setWatchlist] = useState(["NIFTY", "BANKNIFTY", "INDIAVIX"]);
  const [upstoxStatus, setUpstoxStatus] = useState('');

  // Detect Upstox OAuth redirect code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setUpstoxStatus('🔌 Connecting Upstox real-time market access...');
      // Clean the URL immediately so stale code doesn't get reused on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      
      fetch('/api/auth/upstox-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const errMsg = data?.error?.message || data?.message || 'Unknown error';
          setUpstoxStatus(`❌ Upstox Failed: ${errMsg}. Click Connect again.`);
          setTimeout(() => setUpstoxStatus(''), 8000);
        } else {
          setUpstoxStatus(`✅ Upstox Live Feed Active! Welcome ${data.username || 'Trader'} 🎯`);
          setTimeout(() => setUpstoxStatus(''), 6000);
        }
      })
      .catch(err => {
        setUpstoxStatus('❌ Backend offline. Start backend server first, then reconnect.');
        setTimeout(() => setUpstoxStatus(''), 8000);
      });
    }
  }, []);


  // Open WebSocket connection on mount
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:';
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    // If running on Vite dev server (port 3000), connect to backend on port 5000.
    // Otherwise, connect to the current host (like localhost:5000 or ngrok tunnel host) directly.
    const wsUrl = window.location.port === '3000'
      ? `${wsProtocol}//${window.location.hostname}:5000`
      : `${wsProtocol}//${window.location.host}`;
    let socket;
    let fallbackInterval;

    function connect() {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setConnected(true);
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
        console.log("🔌 Connected to Live Trading Server via WebSockets.");
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'snapshot' || payload.type === 'tick') {
          setMarketData(payload.data);
        }
      };

      socket.onclose = () => {
        setConnected(false);
        console.log("🔌 Disconnected. Activating local client-side market simulator...");
        
        // Start self-sufficient client-side ticker interval if backend is offline!
        if (!fallbackInterval) {
          setMarketData(prev => generateLocalMarketData(prev));
          fallbackInterval = setInterval(() => {
            setMarketData(prev => generateLocalMarketData(prev));
          }, 1000);
        }
        
        setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        setConnected(false);
      };
    }

    connect();

    return () => {
      if (socket) socket.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Fetch user profile on mount if token exists
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Invalid token session");
      return res.json();
    })
    .then(data => {
      setUser(data);
      if (data.watchlist) setWatchlist(data.watchlist);
    })
    .catch(() => {
      localStorage.removeItem('token');
      setToken('');
    });
  }, [token]);

  // Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = authMode === 'login' 
      ? { email, password } 
      : { username, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.message || "Authentication failed");
        return;
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.watchlist) setWatchlist(data.user.watchlist);
      setShowAuthModal(false);
      
      // Reset forms
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err) {
      // Offline fallback: allow Guest logging in memory
      if (email === 'guest@bullseye.ai' && password === 'guest123') {
        const fakeUser = { id: "mock_user_100", username: "guest_trader", email: "guest@bullseye.ai", watchlist: ["NIFTY", "BANKNIFTY", "INDIAVIX"], favorites: ["NIFTY", "BANKNIFTY"] };
        setUser(fakeUser);
        setWatchlist(fakeUser.watchlist);
        setShowAuthModal(false);
      } else {
        setAuthError("Server offline. Use 'Instant Guest Demo Mode' to bypass!");
      }
    }
  };

  // Watchlist Toggle
  const toggleWatchlist = async (symbol) => {
    if (!user) {
      setWatchlist(prev => 
        prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
      );
      return;
    }

    const action = watchlist.includes(symbol) ? 'remove' : 'add';
    try {
      const res = await fetch('/api/auth/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ symbol, action })
      });
      const data = await res.json();
      if (res.ok) {
        setWatchlist(data.watchlist);
      }
    } catch (err) {
      // Local adjustment fallback
      setWatchlist(prev => 
        prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
      );
    }
  };

  const handleGuestLogin = () => {
    setEmail('guest@bullseye.ai');
    setPassword('guest123');
    setAuthMode('login');
    setTimeout(() => {
      const guestForm = document.getElementById('auth-form-submit-trigger');
      if (guestForm) guestForm.click();
    }, 100);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setWatchlist(["NIFTY", "BANKNIFTY", "INDIAVIX"]);
  };

  const getActiveSpotPrice = () => {
    if (!marketData || !marketData.indices) return 0;
    return marketData.indices[activeIndex]?.price || 0;
  };

  const getActiveSignal = () => {
    if (!marketData || !marketData.signals) return null;
    const key = activeIndex.toLowerCase();
    return marketData.signals[key] || marketData.signals['nifty'];
  };

  const getActiveOptionChain = () => {
    if (!marketData) return null;
    if (marketData.optionChains && marketData.optionChains[activeIndex]) {
      return marketData.optionChains[activeIndex];
    }
    return activeIndex === 'BANKNIFTY' ? marketData.bankNiftyOptionChain : marketData.niftyOptionChain;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Banner Scrolling ticker tape */}
      <TickerTape data={marketData} />

      {/* Main header block */}
      <header className="app-header">
        <div className="logo-container">
          <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span>BULLSEYE AI</span>
        </div>

        {/* WebSocket health indicator and Profile button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Upstox Direct Connect Button */}
          <button
            onClick={() => window.location.href = 'https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=c20aec17-cfad-4b79-9947-f19fc6a8d915&redirect_uri=http://localhost:3000'}
            className="terminal-btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.72rem',
              background: 'linear-gradient(135deg, hsl(265, 85%, 65%) 0%, #7c3aed 100%)',
              border: 'none',
              boxShadow: '0 0 10px rgba(124, 58, 237, 0.4)'
            }}
          >
            🔌 Connect Upstox (Free)
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span className={`pulse-dot ${connected ? '' : 'offline'}`} />
            <span>{connected ? 'LIVE TICKER DIRECT' : 'LOCAL SIMULATOR CLIENT ACTIVE'}</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-bull" style={{ textTransform: 'none' }}>
                👤 {user.username}
              </span>
              <button onClick={logout} className="terminal-btn terminal-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LogOut size={12} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="terminal-btn" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogIn size={12} /> Terminal Login
            </button>
          )}
        </div>
      </header>

      {/* Upstox Status Notification Banner */}
      {upstoxStatus && (
        <div style={{
          background: 'rgba(124, 58, 237, 0.2)',
          borderBottom: '1px solid #7c3aed',
          color: '#fff',
          padding: '10px 30px',
          fontSize: '0.8rem',
          textAlign: 'center',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          animation: 'pulseGlow 2s infinite alternate'
        }}>
          <Sparkles size={14} className="spinning" />
          <span>{upstoxStatus}</span>
        </div>
      )}

      {/* Dashboard layout structure */}
      <main className="dashboard-grid">
        
        {/* LEFT PANEL: Watchlist, Breadth, Sector Strengths */}
        <section className="side-panel-left flex-column-gap">
          
          {/* Watchlist Panel */}
          <div className="glass-panel flex-column-gap">
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⭐ My Watchlist
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {marketData && marketData.indices && Object.keys(marketData.indices)
                .filter(k => watchlist.includes(k))
                .map((key) => {
                  const idx = marketData.indices[key];
                  const isUp = idx.changePct >= 0;
                  return (
                    <div
                      key={key}
                      onClick={() => setActiveIndex(key)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: activeIndex === key ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.15)',
                        borderLeft: activeIndex === key ? '3px solid var(--color-accent)' : 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{idx.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          ₹{idx.price.toFixed(2)}
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: isUp ? 'var(--color-bull)' : 'var(--color-bear)' }}>
                          {isUp ? '+' : ''}{idx.changePct}%
                        </span>
                        <div
                          onClick={(e) => { e.stopPropagation(); toggleWatchlist(key); }}
                          style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px', cursor: 'pointer' }}
                        >
                          <Heart size={10} fill="var(--color-bear)" stroke="none" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              {watchlist.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                  Your watchlist is empty. Tap hearts on indices selector to save!
                </div>
              )}
            </div>
          </div>

          {/* Breadth & Sector strength panel */}
          <MarketBreadth
            breadth={marketData?.breadth}
            sectorData={marketData?.sectors}
            mood={marketData?.mood}
            fearGreed={marketData?.fearGreed}
          />
        </section>

        {/* CENTER PANEL: Indices selector, charts and Option chain */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          
          {/* Indices Selector */}
          <IndicesSelector
            indices={marketData?.indices}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />

          {/* Interactive Charting Panel */}
          <TradingViewChart
            activeIndex={activeIndex}
            spotPrice={getActiveSpotPrice()}
            signalData={getActiveSignal()}
          />

          {/* Deriv Option Chain Matrix */}
          <OptionChain
            chainData={getActiveOptionChain()}
            spotPrice={getActiveSpotPrice()}
          />
        </section>

        {/* RIGHT PANEL: AI signals, Chat agent, Backtest panel, Alert center */}
        <section className="side-panel-right flex-column-gap">
          
          {/* Quantitative Momentum recommendations */}
          <AiInsights
            activeIndex={activeIndex}
            spotPrice={getActiveSpotPrice()}
            signalData={getActiveSignal()}
            alerts={marketData?.alerts}
          />

          {/* AI Conversational assistant */}
          <AiChatAssistant currentSnapshot={marketData} />

          {/* Backtesting and position calculator */}
          <BacktestingPanel />

          {/* Alerts setup */}
          <AlertManager />
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--panel-border)', background: 'rgba(8,10,16,0.9)', padding: '15px 30px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>📊 <strong>Bullseye AI Dashboard</strong> © 2026. Made for professional intraday derivative trading. Real-time simulated models running out-of-the-box.</span>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="glass-panel" style={{ width: '380px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Orbitron', letterSpacing: '0.5px' }}>
                {authMode === 'login' ? '🔐 Terminal LogIn' : '👤 Register Account'}
              </span>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {authMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="terminal-input"
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="terminal-input"
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="terminal-input"
                />
              </div>

              {authError && (
                <div style={{ color: 'var(--color-bear)', fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center' }}>
                  {authError}
                </div>
              )}

              <button
                id="auth-form-submit-trigger"
                type="submit"
                className="terminal-btn"
                style={{ padding: '8px', marginTop: '5px' }}
              >
                {authMode === 'login' ? 'Access Terminal' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <span onClick={() => { setAuthMode('signup'); setAuthError(''); }} style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 'bold' }}>
                    Register
                  </span>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: 'var(--color-accent)', cursor: 'pointer', fontWeight: 'bold' }}>
                    LogIn
                  </span>
                </span>
              )}
              
              <button
                onClick={handleGuestLogin}
                className="terminal-btn terminal-btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px' }}
              >
                ⚡ Instant Guest Demo Mode
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export { getLocalChatResponse };
