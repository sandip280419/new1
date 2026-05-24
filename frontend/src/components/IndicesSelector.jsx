import React from 'react';

export default function IndicesSelector({ indices, activeIndex, setActiveIndex }) {
  if (!indices) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', width: '100%' }}>
      {Object.keys(indices).map((key) => {
        const idx = indices[key];
        const isSelected = activeIndex === key;
        const isUp = idx.changePct >= 0;
        
        return (
          <div
            key={key}
            onClick={() => setActiveIndex(key)}
            className={`glass-panel hud-font ${isSelected ? (isUp ? 'glowing-panel-bull' : 'glowing-panel-bear') : ''}`}
            style={{
              cursor: 'pointer',
              padding: '12px',
              borderWidth: isSelected ? '1px' : '1px',
              borderStyle: 'solid',
              borderColor: isSelected ? '' : 'rgba(255,255,255,0.06)',
              transform: isSelected ? 'scale(1.02)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '85px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{idx.name}</span>
              {isSelected && <span className="pulse-dot" style={{ background: isUp ? 'var(--color-bull)' : 'var(--color-bear)', boxShadow: `0 0 8px ${isUp ? 'var(--color-bull)' : 'var(--color-bear)'}` }}></span>}
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                {idx.price.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: isUp ? 'var(--color-bull)' : 'var(--color-bear)', marginTop: '2px', display: 'flex', gap: '4px' }}>
                <span>{isUp ? '+' : ''}{idx.change.toFixed(2)}</span>
                <span>({isUp ? '+' : ''}{idx.changePct}%)</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
