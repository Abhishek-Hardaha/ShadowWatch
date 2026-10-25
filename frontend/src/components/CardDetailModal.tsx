'use client';

import React from 'react';
import { X, Copy, Check, Terminal, Shield, Cpu, Activity, HardDrive } from 'lucide-react';

interface CardDetailModalProps {
  card: any;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!card) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(card.raw_payload || card, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlocked = card.verdict === 'BLOCKED' || card.verdict === 'DATA_LEAK_BLOCKED' || card.verdict === 'BLOCKED_AT_CHECKPOINT_1';
  const isApproved = card.verdict === 'APPROVED' || card.verdict === 'CLEAN_APPROVED';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(11, 12, 17, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 30px 70px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(14, 15, 21, 0.96)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono-text" style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                STEP 0{card.step_number} VERBATIM INSPECTOR
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>
                {card.agent_role}
              </span>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
              {card.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {card.badge && (
              <span className="badge-tag" style={{
                background: isBlocked ? 'rgba(239, 68, 68, 0.2)' : isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                color: isBlocked ? '#f87171' : isApproved ? '#34d399' : '#38bdf8',
                border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.4)' : isApproved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.3)'}`
              }}>
                {card.badge}
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '6px',
                padding: '6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Main Verbatim Text */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Verbatim Content / Reasoning
            </label>
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '14px',
              marginTop: '6px',
              fontSize: '0.86rem',
              color: '#f1f5f9',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {card.content}
            </div>
          </div>

          {/* ML Feature Breakdown Table (if available) */}
          {card.raw_payload?.feature_attributions && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Machine Learning Feature Attributions
              </label>
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginTop: '6px'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(168, 85, 247, 0.1)', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: '#e9d5ff' }}>Feature</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#e9d5ff' }}>Observed Value</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#e9d5ff' }}>Model Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {card.raw_payload.feature_attributions.map((fa: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td className="mono-text" style={{ padding: '7px 12px', color: '#cbd5e1' }}>{fa.feature}</td>
                        <td className="mono-text" style={{ padding: '7px 12px', textAlign: 'right', color: '#38bdf8' }}>{fa.value}</td>
                        <td className="mono-text" style={{ padding: '7px 12px', textAlign: 'right', color: '#a855f7' }}>{(fa.importance_weight * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Full Raw JSON Payload */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Raw JSON Telemetry Payload
              </label>
              <button
                onClick={handleCopy}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '5px',
                  padding: '4px 8px',
                  color: copied ? '#34d399' : '#94a3b8',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            
            <pre className="mono-text" style={{
              background: '#07080c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '0.76rem',
              color: '#38bdf8',
              overflowX: 'auto',
              maxHeight: '220px',
              lineHeight: '1.5'
            }}>
              {JSON.stringify(card.raw_payload || card, null, 2)}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(12, 13, 18, 0.9)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(25, 26, 34, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              padding: '7px 16px',
              color: '#e2e8f0',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
