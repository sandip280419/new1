import React from 'react';

export default function OptionChain({ chainData, spotPrice }) {
  if (!chainData || !chainData.strikes) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Select a major index to view the Option Chain Greeks
      </div>
    );
  }

  const { strikes, pcr, totalCallOI, totalPutOI, highestCallOIStrike, highestPutOIStrike, atmStrike } = chainData;

  // Render function to get color for OI cell based on intensity relative to average
  const getHeatmapColor = (oi, isCall) => {
    const maxOI = isCall ? totalCallOI / 6 : totalPutOI / 6;
    const ratio = Math.min(1, oi / maxOI);
    return isCall
      ? `rgba(16, 185, 129, ${ratio * 0.18})` // Green transparent glow for heavy Call OI
      : `rgba(239, 68, 68, ${ratio * 0.18})`; // Red transparent glow for heavy Put OI
  };

  return (
    <div className="glass-panel flex-column-gap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 NSE Live Derivative Chain
            <span className="badge badge-neutral" style={{ textTransform: 'none' }}>
              Spot: {spotPrice?.toFixed(2)}
            </span>
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', fontSize: '0.78rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Call OI: </span>
            <span style={{ fontWeight: 700, color: 'var(--color-bear)' }}>{(totalCallOI / 100000).toFixed(1)}L</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Put OI: </span>
            <span style={{ fontWeight: 700, color: 'var(--color-bull)' }}>{(totalPutOI / 100000).toFixed(1)}L</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>PCR: </span>
            <span className="badge badge-neutral" style={{ background: pcr >= 1.0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: pcr >= 1.0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>
              {pcr}
            </span>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '420px', position: 'relative' }}>
        <table className="terminal-table" style={{ minWidth: '750px' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#0e111a', zIndex: 5 }}>
            <tr>
              <th colSpan="5" style={{ textCombineUpright: 'center', textAlign: 'center', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-bull)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>CALL OPTIONS (BULL RESISTANCES)</th>
              <th style={{ textAlign: 'center', fontWeight: 900, background: 'rgba(255,255,255,0.05)', color: '#fff', width: '90px' }}>STRIKE</th>
              <th colSpan="5" style={{ textCombineUpright: 'center', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-bear)', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>PUT OPTIONS (BEAR SUPPORTS)</th>
            </tr>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <th style={{ padding: '6px' }}>Delta</th>
              <th>Gamma</th>
              <th>OI (Qty)</th>
              <th>Volume</th>
              <th style={{ color: 'var(--color-bull)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>LTP</th>
              <th style={{ textAlign: 'center' }}>Pivots</th>
              <th style={{ color: 'var(--color-bear)', paddingLeft: '8px' }}>LTP</th>
              <th>Volume</th>
              <th>OI (Qty)</th>
              <th>Gamma</th>
              <th>Delta</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((s) => {
              const isATM = s.strike === atmStrike;
              const isCallITM = s.strike < spotPrice;
              const isPutITM = s.strike > spotPrice;
              
              const callOIPoint = s.strike === highestCallOIStrike;
              const putOIPoint = s.strike === highestPutOIStrike;

              return (
                <tr
                  key={s.strike}
                  style={{
                    background: isATM ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    borderLeft: isATM ? '3px solid var(--color-accent)' : 'none',
                    fontWeight: isATM ? '700' : 'normal'
                  }}
                >
                  {/* CALLS */}
                  <td style={{ color: 'var(--text-muted)', background: isCallITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.call.delta}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem', background: isCallITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.call.gamma}
                  </td>
                  <td
                    style={{
                      background: getHeatmapColor(s.call.oi, true),
                      fontWeight: callOIPoint ? '900' : 'inherit',
                      color: callOIPoint ? 'var(--color-warning)' : 'var(--text-main)'
                    }}
                  >
                    {(s.call.oi / 1000).toFixed(0)}k {callOIPoint && '⭐'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', background: isCallITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {(s.call.volume / 1000).toFixed(0)}k
                  </td>
                  <td style={{ color: 'var(--color-bull)', fontWeight: 'bold', borderRight: '1px solid rgba(255,255,255,0.08)', background: isCallITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    ₹{s.call.price}
                  </td>

                  {/* STRIKE PRICE */}
                  <td
                    style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      background: 'rgba(255, 255, 255, 0.04)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  >
                    {s.strike}
                  </td>

                  {/* PUTS */}
                  <td style={{ color: 'var(--color-bear)', fontWeight: 'bold', paddingLeft: '8px', background: isPutITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    ₹{s.put.price}
                  </td>
                  <td style={{ color: 'var(--text-muted)', background: isPutITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {(s.put.volume / 1000).toFixed(0)}k
                  </td>
                  <td
                    style={{
                      background: getHeatmapColor(s.put.oi, false),
                      fontWeight: putOIPoint ? '900' : 'inherit',
                      color: putOIPoint ? 'var(--color-warning)' : 'var(--text-main)'
                    }}
                  >
                    {(s.put.oi / 1000).toFixed(0)}k {putOIPoint && '⭐'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.72rem', background: isPutITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.put.gamma}
                  </td>
                  <td style={{ color: 'var(--text-muted)', background: isPutITM ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {s.put.delta}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px' }}>
        <span>💡 ⭐ Indicates highest Call/Put OI (Wall Resistances/Supports).</span>
        <span>👉 Highlighted strikes represent ITM (In-The-Money) options.</span>
      </div>
    </div>
  );
}
