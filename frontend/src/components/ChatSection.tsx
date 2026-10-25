'use client';

import React, { useState } from 'react';
import { Send, Shield, Sparkles, Bot, User, Cpu } from 'lucide-react';
import CsvTableView from './CsvTableView';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  timestamp: string;
}

interface ChatSectionProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export default function ChatSection({
  messages,
  onSendMessage,
  isLoading
}: ChatSectionProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <section className="liquid-glass" style={{
      padding: '22px',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(12, 13, 18, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 18px 45px -12px rgba(0, 0, 0, 0.9)'
    }}>
      
      {/* Title & Description */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#a855f7" />
            Interactive Agent Console
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Submit benign academic requests or test adversarial attack queries to inspect real-time ML monitoring and dual-checkpoint interception.
          </p>
        </div>
      </div>

      {/* Message History Bubble Area */}
      <div style={{
        background: 'rgba(6, 7, 10, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.07)',
        borderRadius: '12px',
        padding: '16px',
        minHeight: '160px',
        maxHeight: '520px',
        overflowY: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)'
      }}>
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', padding: '28px 16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Bot size={22} color="#64748b" />
            </div>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#94a3b8' }}>
              The Worker Agent is ready in the SIT Pune Workspace.
            </p>
            <p style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
              Enter any academic task or security test query below to observe live behind-the-scenes multi-step execution.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isBlocked = msg.status === 'BLOCKED';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  justifyContent: isUser ? 'flex-end' : 'flex-start'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: isBlocked ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${isBlocked ? 'rgba(244, 63, 94, 0.45)' : 'rgba(255, 255, 255, 0.12)'}`,
                    flexShrink: 0
                  }}>
                    {isBlocked ? <Shield size={16} color="#f43f5e" /> : <Bot size={16} color="#cbd5e1" />}
                  </div>
                )}

                <div style={{
                  maxWidth: '85%',
                  background: isUser
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%), #1a1c24'
                    : isBlocked
                    ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(10, 11, 15, 0.95) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), #101117',
                  border: isUser
                    ? '1px solid rgba(255, 255, 255, 0.14)'
                    : isBlocked
                    ? '1px solid rgba(244, 63, 94, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: isBlocked
                    ? '0 0 20px rgba(244, 63, 94, 0.15), inset 0 1px 0 rgba(244, 63, 94, 0.2)'
                    : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 20px rgba(0, 0, 0, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: isUser ? '#cbd5e1' : (isBlocked ? '#fb7185' : '#34d399'),
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {isUser ? 'You' : (isBlocked ? 'Security Intercept' : 'Worker Agent')}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace' }}>
                      {msg.timestamp}
                    </span>
                  </div>

                  {(() => {
                    const text = msg.content || '';
                    if (!text) return null;

                    // 1. If text contains a markdown table
                    if (!isBlocked && !isUser && text.includes('|') && text.includes('---')) {
                      const sections = text.split('\n\n');
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                          {sections.map((sec, sIdx) => {
                            const lines = sec.trim().split('\n');
                            const isMdTable = lines.length >= 3 && lines[0].includes('|') && lines[1].includes('---');
                            if (isMdTable) {
                              const headers = lines[0].split('|').map(s => s.trim()).filter(Boolean);
                              const rows = lines.slice(2).map(r => r.split('|').map(s => s.trim()).filter(Boolean));
                              const csvString = [
                                headers.join(','),
                                ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
                              ].join('\n');
                              return <CsvTableView key={sIdx} content={csvString} maxHeight="280px" />;
                            }
                            return (
                              <div key={sIdx} style={{ fontSize: '0.86rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.55' }}>
                                {sec}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // 2. Pure CSV block
                    const firstLine = text.trim().split('\n')[0] || '';
                    const isPureCsv = !isBlocked && !isUser && firstLine.includes(',') && text.trim().split('\n').length > 1;
                    if (isPureCsv) {
                      return <CsvTableView content={text} maxHeight="320px" />;
                    }

                    // 3. Regular chat message
                    return (
                      <div style={{ fontSize: '0.86rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.55' }}>
                        {msg.content}
                      </div>
                    );
                  })()}
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    flexShrink: 0
                  }}>
                    <User size={16} color="#cbd5e1" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live AI Processing Indicator when generating output */}
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.25)',
              flexShrink: 0
            }}>
              <Cpu size={16} color="#c084fc" className="animate-spin" />
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.06) 0%, rgba(10, 11, 15, 0.95) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '12px',
              padding: '12px 18px',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(168, 85, 247, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#c084fc' }} className="animate-ping" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Neural Inference in Progress
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
                Synthesizing multi-step plan • Running real-time ML anomaly checks (&lt;2ms) • Awaiting Checkpoint 1 review
              </p>
              {/* Shimmer Wave Bar */}
              <div style={{
                height: '4px',
                width: '180px',
                borderRadius: '2px',
                marginTop: '4px',
                overflow: 'hidden'
              }} className="shimmer-active" />
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the worker agent any benign academic task or test a suspicious exploit query..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'rgba(8, 9, 13, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '13px 18px',
            color: '#f8fafc',
            fontSize: '0.88rem',
            outline: 'none',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.6)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.6)';
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            background: isLoading || !input.trim()
              ? 'rgba(25, 27, 36, 0.5)'
              : 'linear-gradient(135deg, #1f222e, #13141a)',
            border: `1px solid ${isLoading || !input.trim() ? 'rgba(255, 255, 255, 0.06)' : 'rgba(168, 85, 247, 0.55)'}`,
            borderRadius: '10px',
            padding: '0 22px',
            color: isLoading || !input.trim() ? '#64748b' : '#f8fafc',
            fontWeight: 600,
            fontSize: '0.86rem',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: isLoading || !input.trim() ? 'none' : '0 0 20px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          }}
        >
          {isLoading ? (
            <>
              <div style={{ width: '14px', height: '14px', border: '2px solid #c084fc', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Dispatch</span>
              <Send size={15} />
            </>
          )}
        </button>
      </form>

    </section>
  );
}
