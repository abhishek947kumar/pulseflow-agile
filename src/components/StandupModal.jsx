import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, MessageSquare, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

export default function StandupModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { currentBoard, addToast } = useBoard();
  const [standup, setStandup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentBoard) return;

    const generateStandup = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ai/standup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-demo-user-id': user.id
          },
          body: JSON.stringify({ boardId: currentBoard.id })
        });
        const data = await res.json();
        if (data.standup) {
          setStandup(data.standup);
        }
      } catch (err) {
        console.error('Failed to generate standup:', err);
      } finally {
        setLoading(false);
      }
    };

    generateStandup();
  }, [isOpen, currentBoard, user]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!standup?.formattedMarkdown) return;
    navigator.clipboard.writeText(standup.formattedMarkdown);
    setCopied(true);
    addToast('Standup copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>AI Daily Standup Generator</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Aggregated from active timer logs and task transitions for {user?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Sparkles size={24} style={{ margin: '0 auto 12px auto', animation: 'spin 2s linear infinite', color: 'var(--primary)' }} />
              <div>Synthesizing work items and time tracking logs...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Yesterday */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  1. What did I complete yesterday?
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                  {standup?.sections?.yesterday?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Today */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  2. What am I working on today?
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                  {standup?.sections?.today?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Blockers */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  3. Any blockers or dependencies?
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                  {standup?.sections?.blockers?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Footer controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Total logged effort: <strong style={{ color: 'var(--text-main)' }}>{standup?.totalLoggedHours}h</strong>
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={onClose} className="btn-secondary">
                    Close
                  </button>
                  <button onClick={handleCopy} className="btn-primary">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied Markdown!' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
