import React from 'react';

export default function MarketBreadth({ breadth, sectorData, mood, fearGreed }) {
  if (!breadth || !sectorData) return null;

  const advancesPct = breadth.advances;
  const declinesPct = breadth.declines;

  // Fear & Greed gauge calculation
  const getFearGreedColor = (score) => {
    if (score < 30) return 'var(--color-bear)'; // Deep red
    if (score < 50) return 'var(--color-warning)'; // Orange
    if (score < 75) return 'var(--color-bull)'; // Light Green
    return '#10b981'; // Vibrant Green
  };

  return (
    <div className="glass-panel flex-column-gap">
      {/* Sector Strengths & Breadth */}
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📊 Market Breadth (Buyers vs Sellers)
        </span>
        
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-bull)' }}>Advances: {advancesPct}%</span>
            <span style={{ color: 'var(--color-bear)' }}>Declines: {declinesPct}%</span>
          </div>
          
          {/* Dual bar representing breadth */}
          <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'hidden', background: '#222' }}>
            <div style={{ width: `${advancesPct}%`, background: 'var(--color-bull)', transition: 'width 0.4s ease' }} />
            <div style={{ width: `${declinesPct}%`, background: 'var(--color-bear)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Market Sentiment Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '15px' }}>
        {/* Mood Card */}
        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Market Mood</span>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: mood === 'Bullish' ? 'var(--color-bull)' : (mood === 'Bearish' ? 'var(--color-bear)' : 'var(--color-warning)'),
              marginTop: '4px',
              fontFamily: 'Orbitron'
            }}
          >
            {mood === 'Bullish' && '🐂 '}
            {mood === 'Bearish' && '🐻 '}
            {mood === 'Sideways' && '🛡️ '}
            {mood}
          </span>
        </div>

        {/* Fear & Greed Card */}
        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fear & Greed</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: getFearGreedColor(fearGreed.score) }}>{fearGreed.score}</span>
          </div>
          
          <div style={{ fontSize: '0.72rem', fontWeight: 'bold', margin: '4px 0' }}>{fearGreed.label}</div>
          
          {/* Slider indicator */}
          <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'linear-gradient(90deg, var(--color-bear) 0%, var(--color-warning) 50%, var(--color-bull) 100%)' }}>
            <div
              style={{
                position: 'absolute',
                top: '-4px',
                left: `calc(${fearGreed.score}% - 6px)`,
                width: '12px',
                height: '14px',
                borderRadius: '3px',
                background: '#fff',
                border: '2px solid #000',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)',
                transition: 'left 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Sector Strength */}
      <div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🏦 Sector Strength
        </span>
        <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '10px' }}>
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Strength</th>
                <th style={{ textAlign: 'right' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {sectorData.map((sec, idx) => (
                <tr key={idx}>
                  <td>{sec.name}</td>
                  <td className="hud-font" style={{ fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '40px', background: '#222', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${sec.strength}%`, height: '100%', background: sec.color }} />
                      </div>
                      <span>{sec.strength}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: sec.color }}>
                    {sec.trend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
