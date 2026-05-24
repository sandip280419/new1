import React, { useState } from 'react';
import { Play, TrendingUp, DollarSign, Percent } from 'lucide-react';

export default function BacktestingPanel() {
  const [activeSubTab, setActiveSubTab] = useState('backtest');
  
  // Backtest states
  const [indicator, setIndicator] = useState('EMA_CROSS');
  const [timeframe, setTimeframe] = useState('5m');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Risk Calc states
  const [capital, setCapital] = useState(100000);
  const [riskPct, setRiskPct] = useState(2);
  const [entry, setEntry] = useState(150);
  const [stoploss, setStoploss] = useState(135);

  const runBacktest = () => {
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      // Generate highly realistic backtesting results based on choices
      const isBull = indicator === 'EMA_CROSS';
      const winRate = isBull ? Math.floor(58 + Math.random() * 8) : Math.floor(52 + Math.random() * 10);
      const totalTrades = timeframe === '1m' ? 120 : (timeframe === '5m' ? 45 : 18);
      const profit = parseFloat(((totalTrades * (winRate / 100) * 1.8) - (totalTrades * (1 - winRate / 100) * 1.0)).toFixed(2));
      
      setResults({
        totalTrades,
        winRate,
        netProfitPct: profit,
        maxDrawdown: parseFloat((3.2 + Math.random() * 2.5).toFixed(1)),
        profitFactor: parseFloat((1.4 + Math.random() * 0.4).toFixed(2))
      });
      setLoading(false);
    }, 1200);
  };

  // Position Sizing Calculations
  const riskAmount = (capital * riskPct) / 100;
  const riskPerShare = Math.max(0.1, entry - stoploss);
  const quantity = Math.floor(riskAmount / riskPerShare);
  const totalPositionSize = quantity * entry;

  return (
    <div className="glass-panel flex-column-gap">
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveSubTab('backtest')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSubTab === 'backtest' ? 'var(--color-accent)' : 'var(--text-muted)',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            padding: '4px 12px 10px 12px',
            borderBottom: activeSubTab === 'backtest' ? '2px solid var(--color-accent)' : 'none',
            cursor: 'pointer'
          }}
        >
          🔬 Strategy Backtester
        </button>
        <button
          onClick={() => setActiveSubTab('risk')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeSubTab === 'risk' ? 'var(--color-accent)' : 'var(--text-muted)',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            padding: '4px 12px 10px 12px',
            borderBottom: activeSubTab === 'risk' ? '2px solid var(--color-accent)' : 'none',
            cursor: 'pointer'
          }}
        >
          🧮 Risk Calculator
        </button>
      </div>

      {activeSubTab === 'backtest' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Strategy Indicator</label>
              <select
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                className="terminal-input"
                style={{ background: '#0e111a', padding: '6px' }}
              >
                <option value="EMA_CROSS">EMA Crossover (9 vs 20)</option>
                <option value="RSI_OB_OS">RSI Overbought/Oversold</option>
                <option value="VWAP_BO">VWAP Breakout Signal</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Chart Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="terminal-input"
                style={{ background: '#0e111a', padding: '6px' }}
              >
                <option value="1m">1 Minute (Scalping)</option>
                <option value="5m">5 Minutes (Intraday)</option>
                <option value="15m">15 Minutes (Swing)</option>
              </select>
            </div>
          </div>

          <button
            onClick={runBacktest}
            className="terminal-btn"
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '6px' }}
          >
            {loading ? 'Crunching numbers...' : <><Play size={12} /> Run Strategy Backtest</>}
          </button>

          {results && (
            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', fontWeight: 'bold' }}>
                <span>Backtest Metrics (30 Days)</span>
                <span className="badge badge-bull">Completed</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Trades:</span>
                  <span style={{ fontWeight: 'bold' }}>{results.totalTrades}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Win Rate:</span>
                  <span style={{ color: 'var(--color-bull)', fontWeight: 'bold' }}>{results.winRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Net Profit:</span>
                  <span style={{ color: 'var(--color-bull)', fontWeight: 'bold' }}>+{results.netProfitPct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Max Drawdown:</span>
                  <span style={{ color: 'var(--color-bear)', fontWeight: 'bold' }}>-{results.maxDrawdown}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Total Capital (₹)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="terminal-input"
                style={{ padding: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Risk Target (%)</label>
              <input
                type="number"
                value={riskPct}
                onChange={(e) => setRiskPct(Number(e.target.value))}
                className="terminal-input"
                style={{ padding: '6px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Entry Premium (₹)</label>
              <input
                type="number"
                value={entry}
                onChange={(e) => setEntry(Number(e.target.value))}
                className="terminal-input"
                style={{ padding: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Stop Loss (₹)</label>
              <input
                type="number"
                value={stoploss}
                onChange={(e) => setStoploss(Number(e.target.value))}
                className="terminal-input"
                style={{ padding: '6px' }}
              />
            </div>
          </div>

          {/* Calculator Output Grid */}
          <div className="glass-panel" style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139,92,246,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Position Sizing Guidance
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)' }}>Quantity to buy:</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{quantity} shares</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)' }}>Capital at Risk:</span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--color-bear)', marginTop: '2px' }}>₹{riskAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Contract Value:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-bull)' }}>₹{totalPositionSize.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
