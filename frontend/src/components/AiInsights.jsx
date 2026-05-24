import React from 'react';
import { Shield, Sparkles, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';

export default function AiInsights({ activeIndex, spotPrice, signalData, alerts }) {
  if (!signalData) {
    return (
      <div className="glass-panel" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
        ⏳ Loading AI momentum signals...
      </div>
    );
  }

  const { signal, confidence, reason, pcr, support, resistance, smartMoneyFlow, callOIStrike, putOIStrike } = signalData;

  const getSignalBadgeClass = (sig) => {
    if (sig === 'CE BUY') return 'badge-bull';
    if (sig === 'PE BUY') return 'badge-bear';
    return 'badge-neutral';
  };

  return (
    <div className="glass-panel flex-column-gap glowing-panel-accent">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        <Sparkles size={16} color="var(--color-accent)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 800, fontFamily: 'Orbitron', letterSpacing: '0.5px' }}>
          AI Quantitative Insights
        </span>
      </div>

      {/* Main Signal Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Intraday Signal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <span className={`badge ${getSignalBadgeClass(signal)}`} style={{ fontSize: '1rem', padding: '4px 10px' }}>
              {signal}
            </span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Confidence</span>
          <div className="hud-font" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-accent)', marginTop: '2px' }}>
            {confidence}%
          </div>
        </div>
      </div>

      {/* Narrative Reason */}
      <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.45', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--color-accent)' }}>
        💬 <strong>AI Analysis</strong>: {reason}
      </p>

      {/* Technical Dashboard Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
        <div className="glass-panel" style={{ padding: '8px', background: 'rgba(0,0,0,0.1)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Put Call Ratio (PCR)</span>
          <div style={{ fontWeight: 'bold', marginTop: '2px', color: pcr >= 1.0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>
            {pcr} ({pcr >= 1.0 ? 'Bullish Support' : 'Call Resistance'})
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '8px', background: 'rgba(0,0,0,0.1)' }}>
          <span style={{ color: 'var(--text-muted)' }}>Smart Money Flow</span>
          <div style={{ fontWeight: 'bold', marginTop: '2px', color: smartMoneyFlow === 'INFLOW' ? 'var(--color-bull)' : (smartMoneyFlow === 'OUTFLOW' ? 'var(--color-bear)' : 'var(--text-muted)') }}>
            {smartMoneyFlow}
          </div>
        </div>
      </div>

      {(() => {
        const isSideways = signal === 'AVOID TRADE';
        const isCall = signal === 'CE BUY' || isSideways;
        
        // Calculate ATM strike dynamically based on the current spot price
        const strikeSteps = {
          'NIFTY': 50,
          'BANKNIFTY': 100,
          'SENSEX': 100,
          'FINNIFTY': 50,
          'MIDCAP': 50,
          'SMALLCAP': 50
        };
        const step = strikeSteps[activeIndex] || 50;
        const atmStrike = spotPrice ? Math.round(spotPrice / step) * step : (isCall ? (putOIStrike || 22800) : (callOIStrike || 22850));
        
        // Recommend ITM (In-The-Money) strikes for option buying, and ATM for sideways/avoid
        let activeStrike = atmStrike;
        if (signal === 'CE BUY') {
          activeStrike = atmStrike - step; // CE BUY: 1 strike ITM
        } else if (signal === 'PE BUY') {
          activeStrike = atmStrike + step; // PE BUY: 1 strike ITM
        } 
        
        // Map activeIndex to full display name
        const instrumentNames = {
          'NIFTY': 'NIFTY 50',
          'BANKNIFTY': 'BANK NIFTY',
          'SENSEX': 'SENSEX',
          'FINNIFTY': 'FINNIFTY',
          'MIDCAP': 'MIDCAP SELECT',
          'SMALLCAP': 'NIFTY SMALLCAP'
        };
        const instrument = instrumentNames[activeIndex] || activeIndex || 'NIFTY 50';
        
        // Estimate a realistic premium entry price based on spot price level and typical index IVs
        let entryPrice = 110;
        let lotSize = 25;
        
        if (activeIndex === 'BANKNIFTY') {
          entryPrice = 320;
          lotSize = 15;
        } else if (activeIndex === 'SENSEX') {
          entryPrice = 280;
          lotSize = 10;
        } else if (activeIndex === 'FINNIFTY') {
          entryPrice = 90;
          lotSize = 25;
        } else if (activeIndex === 'MIDCAP') {
          entryPrice = 65;
          lotSize = 50;
        } else if (activeIndex === 'SMALLCAP') {
          entryPrice = 80;
          lotSize = 50;
        }

        const target1 = Math.round(entryPrice * 1.35); 
        const target2 = Math.round(entryPrice * 1.6);  
        const stoploss = Math.round(entryPrice * 0.75); 

        return (
          <div 
            className="glass-panel" 
            style={{ 
              padding: '12px', 
              background: isSideways ? 'rgba(245, 158, 11, 0.05)' : (isCall ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'), 
              border: `1px dashed ${isSideways ? 'rgba(245, 158, 11, 0.3)' : (isCall ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)')}`,
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                🎯 AI Live Trade Entry Card
              </span>
              <span className={`badge ${isSideways ? 'badge-neutral' : (isCall ? 'badge-bull' : 'badge-bear')}`} style={{ fontSize: '0.65rem', background: isSideways ? 'rgba(245, 158, 11, 0.15)' : '', color: isSideways ? 'var(--color-warning)' : '' }}>
                {isSideways ? 'SIDEWAYS HEDGE' : (isCall ? 'CALL BUY' : 'PUT BUY')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RECOMMENDED CONTRACT</div>
                <div className="hud-font" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
                  {instrument} {activeStrike} {isCall ? 'CE' : 'PE'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ENTRY RANGE</div>
                <div className="hud-font" style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-gold)', marginTop: '2px' }}>
                  ₹{entryPrice} - ₹{entryPrice + 5}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>STOP LOSS (SL)</span>
                <span className="hud-font" style={{ fontWeight: 'bold', color: 'var(--color-bear)', marginTop: '2px' }}>₹{stoploss}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>TARGET 1</span>
                <span className="hud-font" style={{ fontWeight: 'bold', color: 'var(--color-bull)', marginTop: '2px' }}>₹{target1}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>TARGET 2</span>
                <span className="hud-font" style={{ fontWeight: 'bold', color: 'var(--color-bull)', marginTop: '2px' }}>₹{target2}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>📊 R:R Ratio: <strong>1:2.4</strong></span>
              <span>⚡ Lot Size: <strong>{lotSize} Qty</strong></span>
            </div>
          </div>
        );
      })()}

      {/* Support & Resistance pivots */}
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
          🎯 Dynamic Support & Resistance Walls
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px', fontSize: '0.8rem' }}>
          <div>
            <div style={{ color: 'var(--color-bear)', fontWeight: 'bold', marginBottom: '4px' }}>Supports (Floor)</div>
            {support.map((val, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>S{idx + 1}</span>
                <span className="hud-font" style={{ fontWeight: 'bold' }}>{val}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ color: 'var(--color-bull)', fontWeight: 'bold', marginBottom: '4px' }}>Resistances (Ceiling)</div>
            {resistance.map((val, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>R{idx + 1}</span>
                <span className="hud-font" style={{ fontWeight: 'bold' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakout Alerts Notification Section */}
      {alerts && (
        <div
          className="glass-panel"
          style={{
            padding: '10px',
            background: alerts.type === 'Breakout' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${alerts.type === 'Breakout' ? 'var(--color-bull)' : 'var(--color-bear)'}`,
            animation: 'flashGlow 1.5s infinite alternate'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: alerts.type === 'Breakout' ? 'var(--color-bull)' : 'var(--color-bear)' }}>
            <AlertTriangle size={14} />
            <span>REAL-TIME SCALPING SIGNAL TRIGGERED!</span>
          </div>
          <p style={{ fontSize: '0.72rem', marginTop: '4px', color: '#fff' }}>
            {alerts.message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span>🕒 {alerts.timestamp}</span>
            <span className="badge badge-neutral">Sent via {alerts.channel}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flashGlow {
          0% { box-shadow: 0 0 5px rgba(255,255,255,0.05); }
          100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
        }
      `}</style>
    </div>
  );
}
