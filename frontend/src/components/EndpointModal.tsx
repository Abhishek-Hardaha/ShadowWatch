'use client';

import React, { useState, useEffect } from 'react';
import { X, Link2, Cpu, RefreshCw, AlertCircle } from 'lucide-react';

interface EndpointModalProps {
  currentUrl: string;
  llmHealth: any;
  onClose: () => void;
  onUpdateUrl: (newUrl: string) => Promise<void>;
}

export default function EndpointModal({
  currentUrl,
  llmHealth,
  onClose,
  onUpdateUrl
}: EndpointModalProps) {
  const [urlInput, setUrlInput] = useState(currentUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    setUrlInput(currentUrl || '');
  }, [currentUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsUpdating(true);
    setUpdateMsg('');
    try {
      await onUpdateUrl(urlInput.trim());
      setUpdateMsg('Endpoint updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setUpdateMsg('Error updating: ' + (err.message || String(err)));
    } finally {
      setIsUpdating(false);
    }
  };

  const isActive = Boolean(llmHealth?.active);
  const gpu = llmHealth?.gpu;
  const modelName = llmHealth?.model || 'qwen2.5:14b-instruct';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 3, 5, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(11, 12, 17, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 30px 70px rgba(0, 0, 0, 0.95)',
          position: 'relative'
        }}
      >
        {/* ===================================================================
            1. HEADER: Icon + Title + Subtitle + Close Button
            =================================================================== */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Dual Blade Server Icon Box */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #1c1e28, #101117)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 10px 25px rgba(0, 0, 0, 0.7)'
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="7" rx="2" />
                <rect x="2" y="13" width="20" height="7" rx="2" />
                <line x1="6" y1="7.5" x2="8" y2="7.5" />
                <line x1="6" y1="16.5" x2="8" y2="16.5" />
                <line x1="14" y1="7.5" x2="18" y2="7.5" />
                <line x1="14" y1="16.5" x2="18" y2="16.5" />
              </svg>
            </div>

            <div>
              <h2 style={{ fontSize: '1.42rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                LLM Endpoint Configuration
              </h2>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', margin: '4px 0 0', fontWeight: 400 }}>
                {isActive ? 'Manage your active inference endpoint' : 'Connect your active inference endpoint'}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================================
            2. STATUS BANNER (Disconnected vs Connected)
            =================================================================== */}
        {!isActive ? (
          /* DISCONNECTED STATE */
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '16px',
              padding: '18px 22px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '18px',
              flexWrap: 'wrap'
            }}
          >
            {/* Left Warning + Text */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(239, 68, 68, 0.15) 70%, transparent 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 14px rgba(239, 68, 68, 0.6)'
                  }}
                >
                  <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.15rem', lineHeight: 1 }}>!</span>
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  ENDPOINT NOT CONNECTED · ACTION REQUIRED
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.45' }}>
                  Paste the public tunnel URL provided by your running inference server to connect ShadowTrace.
                </div>
              </div>
            </div>

            {/* Right Model Badge */}
            <div
              style={{
                background: 'rgba(18, 19, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexShrink: 0
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Model :</span>
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 600 }}>
                {modelName}
              </span>
            </div>
          </div>
        ) : (
          /* CONNECTED & OPERATIONAL STATE */
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.04)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '20px 22px',
              marginBottom: '24px'
            }}
          >
            {/* Top Row: Active Indicator + Model */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 14px #10b981'
                  }}
                  className="animate-pulse"
                />
                <span
                  style={{
                    color: '#10b981',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  ENDPOINT REACHABLE & OPERATIONAL
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.82rem' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Model:</span>
                <span style={{ color: '#e2e8f0', fontFamily: 'monospace', fontWeight: 600 }}>
                  {modelName}
                </span>
              </div>
            </div>

            {/* Bottom Row: 2 Metric Cards (GPU Model & VRAM) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Card 1: GPU Model */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Cpu size={22} color="#10b981" />
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
                    GPU Model
                  </div>
                  <div style={{ color: '#f8fafc', fontSize: '0.96rem', fontWeight: 700, marginTop: '2px' }}>
                    {gpu?.name || 'Tesla T4'}
                  </div>
                </div>
              </div>

              {/* Card 2: VRAM */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="3" />
                    <circle cx="8" cy="12" r="1.5" fill="#10b981" />
                    <circle cx="16" cy="12" r="1.5" fill="#10b981" />
                    <line x1="2" y1="10" x2="4" y2="10" />
                    <line x1="2" y1="14" x2="4" y2="14" />
                    <line x1="20" y1="10" x2="22" y2="10" />
                    <line x1="20" y1="14" x2="22" y2="14" />
                  </svg>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 500 }}>
                    VRAM
                  </div>
                  <div style={{ color: '#f8fafc', fontSize: '0.96rem', fontWeight: 700, marginTop: '2px' }}>
                    {gpu?.used_mb ? `${gpu.used_mb} MB (${gpu.pct}%)` : '9276.9 MB (62.2%)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            3. INPUT FIELD: Inference Endpoint URL
            =================================================================== */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '26px' }}>
            {/* Label with teal link badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  border: '1px solid rgba(20, 184, 166, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Link2 size={15} color="#2dd4bf" />
              </div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>
                {isActive ? 'Inference Endpoint URL' : 'Endpoint URL'}
              </label>
            </div>

            {/* Input Box with teal glow outline and inner link icon */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Link2 size={18} color="#64748b" />
              </div>

              <input
                type="text"
                autoFocus
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-active-endpoint.example.com"
                style={{
                  width: '100%',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(9, 10, 14, 0.95)',
                  border: '1.5px solid #14b8a6',
                  boxShadow: '0 0 16px rgba(20, 184, 166, 0.22)',
                  padding: '0 16px 0 46px',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            </div>

            {updateMsg && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '0.78rem',
                  color: updateMsg.includes('Error') ? '#f87171' : '#34d399',
                  fontWeight: 600
                }}
              >
                {updateMsg}
              </div>
            )}
          </div>

          {/* ===================================================================
              4. ACTION BUTTONS: Cancel + Save & Connect
              =================================================================== */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '46px',
                padding: '0 26px',
                borderRadius: '12px',
                background: 'rgba(20, 21, 28, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 21, 28, 0.85)';
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUpdating}
              style={{
                height: '46px',
                padding: '0 28px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4f46e5 100%)',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isUpdating) {
                  e.currentTarget.style.filter = 'brightness(1.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {isUpdating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} color="#ffffff" />
              )}
              <span>{isUpdating ? 'Connecting...' : 'Save & Connect'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
