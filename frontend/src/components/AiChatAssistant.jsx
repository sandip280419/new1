import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';

export default function AiChatAssistant({ currentSnapshot }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hello! I am **Bullseye AI**, your real-time options quant. Ask me anything about today's trends or trade options setups!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto-scroll chat box when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || inputText;
    if (!queryText.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: queryText }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });
      const data = await response.json();
      
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply || "Unable to extract response from Gemini Engine." }]);
    } catch (err) {
      if (currentSnapshot) {
        try {
          const { getLocalChatResponse } = await import('../App.jsx');
          const reply = getLocalChatResponse(queryText, currentSnapshot);
          setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
        } catch (e) {
          setMessages((prev) => [...prev, { sender: 'ai', text: "❌ Connection error while trying to fetch live analysis." }]);
        }
      } else {
        setMessages((prev) => [...prev, { sender: 'ai', text: "❌ Connection error while trying to fetch live analysis." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutClick = (query) => {
    handleSendMessage(query);
  };

  // Simplistic Markdown highlighter for bullet points, bold markers, and code boxes
  const formatMarkdown = (text) => {
    if (!text) return "";
    let formatted = text;
    
    // Replace code highlights `strike` or `value`
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; color: var(--color-accent); font-family: monospace; font-size: 0.8rem;">$1</code>');
    
    // Replace Bold headers like **Buy Nifty**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #fff; font-weight: 700;">$1</strong>');
    
    // Replace bullet points * text
    formatted = formatted.replace(/^\*\s(.*)$/gm, '<li style="margin-left: 12px; margin-bottom: 4px; font-size: 0.8rem; list-style-type: square; color: var(--text-main);">$1</li>');

    // Replace linebreaks with actual breaks
    formatted = formatted.replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const shortcuts = [
    "Should I buy CE or PE now?",
    "What is Bank Nifty trend?",
    "Best strike price for today?"
  ];

  return (
    <div className="glass-panel flex-column-gap" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={16} color="var(--color-accent)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'Orbitron', letterSpacing: '0.5px' }}>
            AI Live Terminal Chat
          </span>
        </div>
        <span className="badge badge-bull" style={{ fontSize: '0.65rem' }}>Gemini 1.5 Active</span>
      </div>

      {/* Message Area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-bubble ${m.sender}`}>
            {formatMarkdown(m.text)}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <RefreshCw size={12} className="spinning" />
            <span>AI analyzing live derivative snapshots...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Shortcuts List */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}>
        {shortcuts.map((shortcut, idx) => (
          <button
            key={idx}
            onClick={() => handleShortcutClick(shortcut)}
            disabled={loading}
            className="terminal-btn-secondary"
            style={{
              padding: '4px 8px',
              fontSize: '0.68rem',
              borderRadius: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {shortcut}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about CE/PE strikes or index momentum..."
          className="terminal-input"
          disabled={loading}
          style={{ flex: 1, fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}
        />
        <button
          type="submit"
          className="terminal-btn"
          disabled={loading}
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={14} />
        </button>
      </form>

      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
