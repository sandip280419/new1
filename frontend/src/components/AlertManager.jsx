import React, { useState } from 'react';
import { Bell, Send, Check } from 'lucide-react';

export default function AlertManager() {
  const [browserAlerts, setBrowserAlerts] = useState(false);
  const [telegramAlerts, setTelegramAlerts] = useState(false);
  const [whatsappAlerts, setWhatsAppAlerts] = useState(false);
  
  // Custom form inputs
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [waNumber, setWaNumber] = useState('');
  
  const [status, setStatus] = useState('');

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      setStatus('Browser does not support desktop notifications.');
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setBrowserAlerts(true);
      setStatus('🔔 Browser notifications enabled successfully!');
      // Trigger a sample alert
      new Notification("BULLSEYE AI // Signals", {
        body: "Real-time volatility and breakout notifications are active!",
        icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%252310b981' stroke-width='2'%3E%3Cpolyline points='23 6 13.5 15.5 8.5 10.5 1 18'%3E%3C/polyline%3E%3Cpolyline points='17 6 23 6 23 12'%3E%3C/polyline%3E%3C/svg%3E"
      });
    } else {
      setStatus('Permission denied.');
    }
    setTimeout(() => setStatus(''), 3000);
  };

  const saveSettings = (e) => {
    e.preventDefault();
    setStatus('✅ Integration configuration saved successfully.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="glass-panel flex-column-gap">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        <Bell size={16} color="var(--color-accent)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'Orbitron', letterSpacing: '0.5px' }}>
          Real-Time Alert Center
        </span>
      </div>

      <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Toggle browser notifications */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px' }}>
          <div>
            <div style={{ fontWeight: 'bold' }}>Desktop Browser Push</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Get direct volume and scalp spikes.</div>
          </div>
          <button
            onClick={requestBrowserPermission}
            className={`terminal-btn ${browserAlerts ? 'badge-bull' : 'terminal-btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.7rem' }}
          >
            {browserAlerts ? 'Active ✓' : 'Authorize'}
          </button>
        </div>

        {/* Integration Forms */}
        <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Telegram Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>✈️ Telegram alert bot channel</span>
              <input
                type="checkbox"
                checked={telegramAlerts}
                onChange={(e) => setTelegramAlerts(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            {telegramAlerts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Bot API Token (e.g. 5231...)"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="terminal-input"
                  style={{ padding: '4px', fontSize: '0.7rem' }}
                />
                <input
                  type="text"
                  placeholder="Chat / Channel ID (e.g. -1004...)"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="terminal-input"
                  style={{ padding: '4px', fontSize: '0.7rem' }}
                />
              </div>
            )}
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.04)' }} />

          {/* WhatsApp Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold' }}>💬 WhatsApp Alerts API</span>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsAppAlerts(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            {whatsappAlerts && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginTop: '4px' }}>
                <input
                  type="text"
                  placeholder="Phone number (+91...)"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="terminal-input"
                  style={{ padding: '4px', fontSize: '0.7rem', width: '100%' }}
                />
              </div>
            )}
          </div>

          <button type="submit" className="terminal-btn" style={{ padding: '6px', width: '100%', fontSize: '0.72rem', marginTop: '6px' }}>
            Save Integration Settings
          </button>
        </form>

        {status && (
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#fff', padding: '8px', borderRadius: '4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 'bold' }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
