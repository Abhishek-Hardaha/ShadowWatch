'use client';

import React from 'react';
import { ShieldAlert, RefreshCw, FolderSearch } from 'lucide-react';

interface HeaderProps {
  llmHealth: any;
  onOpenEndpointModal: () => void;
  onOpenWorkspaceModal: () => void;
  onResetWorkspace: () => void;
  isResetting: boolean;
}

export default function Header({
  llmHealth,
  onOpenEndpointModal,
  onOpenWorkspaceModal,
  onResetWorkspace,
  isResetting
}: HeaderProps) {
  const isLlmActive = llmHealth?.active;
  const gpuInfo = llmHealth?.gpu;
  const modelName = llmHealth?.model || 'qwen2.5:14b-instruct';

  return (
    <header className="liquid-glass" style={{
      marginBottom: '20px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px',
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(12, 13, 18, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 16px 40px -12px rgba(0, 0, 0, 0.9)'
    }}>
      {/* Brand & Campus Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #181922, #0d0e13)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(0, 0, 0, 0.8)'
        }}>
          <ShieldAlert size={24} color="#f8fafc" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
              SHADOWTRACE
            </h1>
            <span className="badge-tag" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}>
              SIT PUNE SANDBOX
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Autonomous Agent Surveillance & Threat Interception • Dual Checkpoint Supervision
          </p>
        </div>
      </div>

      {/* Center/Right Controls: Live LLM Telemetry & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        
        {/* Live LLM Active/Inactive Pill */}
        <button
          onClick={onOpenEndpointModal}
          style={{
            background: isLlmActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            border: `1px solid ${isLlmActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'}`,
            borderRadius: '10px',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isLlmActive ? '0 0 15px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(244, 63, 94, 0.15), inset 0 1px 0 rgba(244, 63, 94, 0.2)'
          }}
          title="Click to view or edit LLM endpoint URL"
        >
          <div style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: isLlmActive ? '#10b981' : '#f43f5e',
            boxShadow: isLlmActive ? '0 0 10px #10b981' : '0 0 10px #f43f5e'
          }} className={isLlmActive ? 'pulse-green' : 'pulse-red'} />
          
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.04em', color: isLlmActive ? '#34d399' : '#fb7185' }}>
              {isLlmActive ? 'LLM ACTIVE (COLAB)' : 'LLM INACTIVE'}
            </div>
            <div className="mono-text" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {isLlmActive ? `${modelName}` : 'Click to connect endpoint'}
            </div>
          </div>

          {gpuInfo?.available && (
            <div style={{
              borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
              paddingLeft: '10px',
              fontSize: '0.7rem',
              color: '#cbd5e1',
              fontFamily: 'var(--font-mono)'
            }}>
              GPU: {gpuInfo.used_mb} MB ({gpuInfo.pct}%)
            </div>
          )}
        </button>

        {/* Workspace Explorer Button */}
        <button
          onClick={onOpenWorkspaceModal}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(20, 22, 29, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            color: '#f1f5f9',
            borderRadius: '10px',
            padding: '8px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <FolderSearch size={15} color="#94a3b8" />
          <span>Explore Workspace</span>
        </button>

        {/* Reset Sandbox Button */}
        <button
          onClick={onResetWorkspace}
          disabled={isResetting}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%), rgba(16, 17, 23, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            color: isResetting ? '#64748b' : '#94a3b8',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Restore all sandbox workspace files to pristine original state"
        >
          <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
          <span>{isResetting ? 'Resetting...' : 'Reset Sandbox'}</span>
        </button>

      </div>
    </header>
  );
}
