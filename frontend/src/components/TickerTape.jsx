import React from 'react';

export default function TickerTape({ data }) {
  if (!data || !data.indices) return null;

  const { NIFTY, BANKNIFTY, SENSEX, FINNIFTY, INDIAVIX } = data.indices;
  const usdinr = data.correlations?.USDINR;
  const gold = data.correlations?.GOLD;

  const items = [
    { name: "NIFTY 50", price: NIFTY.price, pct: NIFTY.changePct },
    { name: "BANK NIFTY", price: BANKNIFTY.price, pct: BANKNIFTY.changePct },
    { name: "SENSEX", price: SENSEX.price, pct: SENSEX.changePct },
    { name: "FINNIFTY", price: FINNIFTY.price, pct: FINNIFTY.changePct },
    { name: "INDIA VIX", price: INDIAVIX.price, pct: INDIAVIX.changePct, isVix: true },
    { name: "USDINR", price: usdinr?.price, pct: usdinr?.changePct },
    { name: "GOLD (10g)", price: gold?.price, pct: gold?.changePct, isGold: true }
  ];

  // Repeat twice for seamless scrolling
  const renderItems = [...items, ...items];

  return (
    <div className="ticker-tape-container">
      <div className="ticker-tape-track">
        {renderItems.map((item, idx) => {
          const isUp = item.pct >= 0;
          return (
            <div key={idx} className={`ticker-item ${isUp ? 'up' : 'down'}`}>
              <span style={{ color: '#fff', fontWeight: 500 }}>{item.name}</span>
              <span className="ticker-val hud-font">
                {item.isGold ? `₹${item.price?.toLocaleString()}` : item.price}
              </span>
              <span>{isUp ? '▲' : '▼'} {Math.abs(item.pct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
