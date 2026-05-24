import React, { useState, useEffect, useRef } from 'react';

export default function MobileView() {
  const [snapshot, setSnapshot] = useState(null);
  const [activeIndex, setActiveIndex] = useState('NIFTY');
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const wsRef = useRef(null);

  const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCAP', 'SMALLCAP', 'SENSEX'];

  useEffect(() => {
    // Auto-detect wss vs ws, and port (when served from backend on same port, no :5000 needed)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (window.location.protocol === 'https:' ? '' : '5000');
    const wsUrl = port && port !== '80' && port !== '443'
      ? `${protocol}//${host}:${port}`
      : `${protocol}//${host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => { setConnected(false); setTimeout(() => window.location.reload(), 3000); };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'snapshot' || msg.type === 'tick') {
          setSnapshot(msg.data);
          setLastUpdate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (_) {}
    };
    return () => ws.close();
  }, []);

  const indexData = snapshot?.indices?.[activeIndex];
  const signalData = snapshot?.signals?.[activeIndex.toLowerCase()];
  const vix = snapshot?.indices?.INDIAVIX;
  const isMarketOpen = snapshot?.isMarketOpen;

  const getSignalColor = (sig) => {
    if (!sig) return '#94a3b8';
    if (sig === 'CE BUY') return '#10b981';
    if (sig === 'PE BUY') return '#ef4444';
    return '#f59e0b';
  };

  const getSignalBg = (sig) => {
    if (!sig) return 'rgba(148,163,184,0.1)';
    if (sig === 'CE BUY') return 'rgba(16,185,129,0.12)';
    if (sig === 'PE BUY') return 'rgba(239,68,68,0.12)';
    return 'rgba(245,158,11,0.12)';
  };

  const getSignalIcon = (sig) => {
    if (sig === 'CE BUY') return '📈';
    if (sig === 'PE BUY') return '📉';
    return '⏸️';
  };

  const getLotSize = (key) => {
    const sizes = { NIFTY: 25, BANKNIFTY: 15, FINNIFTY: 25, MIDCAP: 50, SMALLCAP: 50, SENSEX: 10 };
    return sizes[key] || 25;
  };

  const getStrike = (price) => {
    if (!price) return '--';
    return Math.round(price / 50) * 50;
  };

  const getPremium = (key) => {
    const premiums = { NIFTY: '₹120-180', BANKNIFTY: '₹200-320', FINNIFTY: '₹100-160', MIDCAP: '₹80-130', SMALLCAP: '₹60-100', SENSEX: '₹250-400' };
    return premiums[key] || '₹100-200';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060912 0%, #0d1220 50%, #091018 100%)',
      fontFamily: "'Inter', sans-serif",
      color: '#e2e8f0',
      padding: '0',
      overflowX: 'hidden'
    }}>
      {/* Top Status Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.6)',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎯 BULLSEYE
          </span>
          <span style={{ fontSize: '0.6rem', color: '#64748b', background: 'rgba(99,102,241,0.15)', padding: '2px 6px', borderRadius: '4px' }}>AI TRADER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMarketOpen === false && (
            <span style={{ fontSize: '0.6rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
              MARKET CLOSED
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? '#10b981' : '#ef4444', boxShadow: connected ? '0 0 6px #10b981' : 'none' }} />
            <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{connected ? lastUpdate : 'RECONNECTING...'}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Index Selector Scrollable */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {indices.map(idx => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: '20px',
                border: activeIndex === idx ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                background: activeIndex === idx ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                color: activeIndex === idx ? '#a5b4fc' : '#64748b',
                fontSize: '0.72rem',
                fontWeight: activeIndex === idx ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {idx === 'BANKNIFTY' ? 'BANK NIFTY' : idx}
            </button>
          ))}
        </div>

        {/* Live Price Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {activeIndex === 'BANKNIFTY' ? 'BANK NIFTY' : activeIndex} SPOT
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace', marginTop: '4px', color: '#f1f5f9' }}>
              {indexData ? `₹${indexData.price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---'}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '2px', color: indexData?.change >= 0 ? '#10b981' : '#ef4444' }}>
              {indexData ? `${indexData.change >= 0 ? '▲' : '▼'} ${Math.abs(indexData.change)?.toFixed(2)} (${Math.abs(indexData.changePct)?.toFixed(2)}%)` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>INDIA VIX</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: vix?.price > 20 ? '#ef4444' : '#10b981' }}>
              {vix?.price?.toFixed(2) || '--'}
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
              {vix?.price > 20 ? '⚠️ High Risk' : '✅ Low Risk'}
            </div>
          </div>
        </div>

        {/* AI SIGNAL CARD - Main Focus */}
        <div style={{
          background: getSignalBg(signalData?.signal),
          border: `1px solid ${getSignalColor(signalData?.signal)}40`,
          borderRadius: '20px',
          padding: '20px',
          boxShadow: `0 0 30px ${getSignalColor(signalData?.signal)}20`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>AI LIVE SIGNAL</div>
              <div style={{ fontSize: '2.2rem', marginTop: '4px' }}>{getSignalIcon(signalData?.signal)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: getSignalColor(signalData?.signal),
                fontFamily: 'monospace',
                letterSpacing: '2px'
              }}>
                {signalData?.signal || 'WAIT'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Confidence: <span style={{ color: signalData?.confidence > 75 ? '#10b981' : '#f59e0b', fontWeight: 700 }}>{signalData?.confidence || '--'}%</span>
              </div>
            </div>
          </div>

          {/* AI Reason */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '0.78rem',
            lineHeight: '1.5',
            color: '#cbd5e1',
            borderLeft: `3px solid ${getSignalColor(signalData?.signal)}`,
            marginBottom: '14px'
          }}>
            💬 {signalData?.reason || 'Analyzing market conditions...'}
          </div>

          {/* Trade Entry Box */}
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              📋 TRADE ENTRY DETAILS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>OPTION TYPE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: getSignalColor(signalData?.signal), marginTop: '2px' }}>
                  {signalData?.signal === 'CE BUY' ? '📈 CALL (CE)' : signalData?.signal === 'PE BUY' ? '📉 PUT (PE)' : '⏸️ HOLD'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>STRIKE PRICE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                  {getStrike(indexData?.price)} {signalData?.signal?.includes('CE') ? 'CE' : signalData?.signal?.includes('PE') ? 'PE' : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>LOT SIZE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                  {getLotSize(activeIndex)} shares
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#64748b' }}>EST. PREMIUM</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginTop: '2px' }}>
                  {getPremium(activeIndex)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support / Resistance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🛡️ SUPPORT</div>
            {signalData?.support?.slice(0, 2).map((s, i) => (
              <div key={i} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', fontFamily: 'monospace' }}>
                S{i + 1}: {s?.toLocaleString('en-IN')}
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '14px', padding: '14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 RESISTANCE</div>
            {signalData?.resistance?.slice(0, 2).map((r, i) => (
              <div key={i} style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginTop: '4px', fontFamily: 'monospace' }}>
                R{i + 1}: {r?.toLocaleString('en-IN')}
              </div>
            ))}
          </div>
        </div>

        {/* PCR & Smart Money */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px' }}>
          <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>📊 KEY INDICATORS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>PCR</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: signalData?.pcr >= 1 ? '#10b981' : '#ef4444' }}>
                {signalData?.pcr || '--'}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748b' }}>{signalData?.pcr >= 1 ? 'Bullish' : 'Bearish'}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>MAX CALL OI</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                {signalData?.callOIStrike?.toLocaleString('en-IN') || '--'}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Resistance</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.6rem', color: '#64748b' }}>MAX PUT OI</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
                {signalData?.putOIStrike?.toLocaleString('en-IN') || '--'}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Support</div>
            </div>
          </div>
        </div>

        {/* Bottom Padding */}
        <div style={{ height: '20px' }} />
      </div>
    </div>
  );
}
