'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Activity,
  ShieldCheck,
  ShieldX,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Download,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import CsvTableView from './CsvTableView';

export interface StepDetail {
  step_num: number;
  name: string;
  duration: string;
  worker: {
    title: string;
    thought?: string;
    planned_steps?: string[];
    tool_call?: { tool: string; arguments: any };
    output_preview?: string;
    candidate_preview?: string;
  };
  ml_check: {
    isolation_forest: number;
    decision_tree: number;
    action_classifier: number;
    overall_risk: number;
    risk_level: string;
  };
  supervisor: {
    title: string;
    analysis: string;
    verdict: string;
    badge_text: string;
  };
}

export interface FinalOutcome {
  is_blocked: boolean;
  title: string;
  duration: string;
  summary: string;
  withheld_message?: string;
  reasons?: string[];
  deliverable_preview?: string;
  total_steps?: number;
  total_time?: string;
  final_risk_score?: number;
  is_file?: boolean;
  file_path?: string;
  total_records?: number;
}

export interface TurnRecord {
  id: string;
  turn_number: number;
  timestamp: string;
  user_prompt: string;
  overall_status: string;
  overall_risk: number;
  steps: StepDetail[];
  final_outcome: FinalOutcome;
  delivered_response: string;
  target?: string;
  tool?: string;
}

interface ShowcaseTimelineProps {
  turns?: TurnRecord[];
  activeTurnIndex?: number;
  onSelectTurn?: (index: number) => void;
  isRunning: boolean;
  cards?: any[];
  onSelectCard?: (card: any) => void;
}

export default function ShowcaseTimeline({
  turns = [],
  activeTurnIndex = 0,
  onSelectTurn,
  isRunning
}: ShowcaseTimelineProps) {
  const [copied, setCopied] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Live execution timer while running
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      setTimerSeconds(0);
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Determine current active turn
  const currentTurn: TurnRecord | undefined = turns[activeTurnIndex] || turns[turns.length - 1];

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // If no turns yet and not running: Display high-tech ready standby state
  if ((!turns || turns.length === 0) && !isRunning) {
    return (
      <div className="liquid-glass" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(11, 12, 17, 0.88)',
        border: '1px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        padding: '38px 24px',
        textAlign: 'center',
        marginBottom: '24px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 18px 40px -12px rgba(0, 0, 0, 0.85)'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #1c1e28, #101117)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 20px rgba(0, 0, 0, 0.6)'
        }}>
          <Activity size={24} color="#a855f7" />
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
          Autonomous Multi-Step Surveillance Engine Ready
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', maxWidth: '580px', margin: '0 auto 16px', lineHeight: '1.5' }}>
          Submit academic tasks or security test prompts above. The Worker Agent, ML anomaly models, and LLM Supervisor will execute and inspect each query across dual security checkpoints in real time.
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '20px',
          fontSize: '0.75rem',
          color: '#34d399',
          fontWeight: 700,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
          Awaiting Live Query Execution
        </div>
      </div>
    );
  }

  const isBlocked = currentTurn?.overall_status === 'BLOCKED';
  const steps = currentTurn?.steps || [];
  const finalOutcome = currentTurn?.final_outcome;

  return (
    <div className="liquid-glass" style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(11, 12, 17, 0.94)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '14px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 20px 50px -12px rgba(0, 0, 0, 0.95)'
    }}>

      {/* =====================================================================
          1. HEADER BAR: Title, Live Status Pill & Timer
          ===================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        paddingBottom: '16px',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1c1e28, #0f1016)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 8px 20px rgba(0, 0, 0, 0.6)'
          }}>
            <Bot size={22} color="#f8fafc" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Worker Agent Execution
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Autonomous agent executing your request with ML security checks and supervising agent analysis
            </p>
          </div>
        </div>

        {/* Execution Status Badge & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isRunning ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.55)',
              borderRadius: '10px',
              padding: '6px 14px',
              color: '#c084fc',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(168, 85, 247, 0.3)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c084fc' }} className="animate-ping" />
              <span>Inference Active</span>
              <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{formatTimer(timerSeconds)}</span>
            </div>
          ) : isBlocked ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.55)',
              borderRadius: '10px',
              padding: '6px 14px',
              color: '#fb7185',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(244, 63, 94, 0.2), inset 0 1px 0 rgba(244, 63, 94, 0.25)'
            }}>
              <ShieldX size={15} color="#f43f5e" />
              <span>Blocked by Supervisor</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              borderRadius: '10px',
              padding: '6px 14px',
              color: '#34d399',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle size={15} color="#10b981" />
              <span>Completed (Dual Checkpoints Passed)</span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          2. MULTI-QUERY CONVERSATION THREAD NAVIGATOR
          ===================================================================== */}
      {turns.length > 0 && (
        <div style={{
          background: 'rgba(6, 7, 10, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Query Thread ({turns.length} Turn{turns.length > 1 ? 's' : ''}):
            </span>
            {turns.map((t, idx) => {
              const isSelected = (idx === activeTurnIndex) || (!activeTurnIndex && idx === turns.length - 1);
              const riskColor = t.overall_risk >= 0.7 ? '#f43f5e' : (t.overall_risk >= 0.4 ? '#f59e0b' : '#10b981');
              return (
                <button
                  key={t.id || idx}
                  onClick={() => onSelectTurn && onSelectTurn(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '7px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.07)'}`,
                    color: isSelected ? '#f8fafc' : '#94a3b8',
                    fontSize: '0.74rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: riskColor
                  }} />
                  <span>Turn {t.turn_number}: {t.user_prompt.slice(0, 26)}...</span>
                  <span style={{
                    fontSize: '0.66rem',
                    color: riskColor,
                    fontWeight: 700,
                    background: 'rgba(0,0,0,0.4)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    {t.overall_risk.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Persistence Multi-Turn Escalation Indicator */}
          <div style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>Multi-Turn Deception Watch:</span>
            <span style={{
              fontWeight: 700,
              color: isBlocked ? '#f43f5e' : '#10b981'
            }}>
              {isBlocked ? 'Persistent Pretexting Intercepted' : 'Benign Academic Exploration'}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. USER REQUEST CARD
          ===================================================================== */}
      {currentTurn && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%), rgba(14, 15, 21, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 20px rgba(0, 0, 0, 0.5)',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <FileText size={17} color="#cbd5e1" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                User Request (Turn {currentTurn.turn_number})
              </div>
              <div style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 600, marginTop: '2px' }}>
                {currentTurn.user_prompt}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>
            {currentTurn.timestamp}
          </div>
        </div>
      )}

      {/* =====================================================================
          4. COLUMN HEADERS (Step | Worker Agent | ML Security Check | Supervising Agent)
          ===================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 1fr 1fr',
        gap: '14px',
        padding: '0 6px 10px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        marginBottom: '16px'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Step
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#f1f5f9' }}>
          <Bot size={15} color="#cbd5e1" />
          <span>Worker Agent</span>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 400 }}>(Actions & tool calls)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#34d399' }}>
          <Activity size={15} color="#10b981" />
          <span>ML Security Check</span>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 400 }}>(Multi-model telemetry)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', fontWeight: 700, color: '#c084fc' }}>
          <ShieldCheck size={15} color="#a855f7" />
          <span>Supervising Agent</span>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 400 }}>(Review & sovereign decision)</span>
        </div>
      </div>

      {/* =====================================================================
          5. MULTI-STEP 3-COLUMN EXECUTION GRID
          ===================================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
        {steps.map((st, idx) => {
          const isStepRunning = st.duration === 'Executing...' || st.supervisor.verdict === 'RUNNING';
          const isHighRisk = st.ml_check.overall_risk >= 0.7;
          const isMedRisk = st.ml_check.overall_risk >= 0.4;
          const isSupervisorApproved = st.supervisor.verdict === 'APPROVED' || st.supervisor.verdict === 'CLEAN_APPROVED';

          const riskBadgeColor = isStepRunning ? '#c084fc' : (isHighRisk ? '#f43f5e' : (isMedRisk ? '#f59e0b' : '#10b981'));
          const riskBg = isStepRunning ? 'rgba(168, 85, 247, 0.1)' : (isHighRisk ? 'rgba(244, 63, 94, 0.12)' : (isMedRisk ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.1)'));

          return (
            <div
              key={st.step_num || idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 1fr 1fr',
                gap: '14px',
                alignItems: 'stretch'
              }}
            >
              {/* Left Column: Numbered Step Indicator */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isStepRunning
                    ? 'rgba(168, 85, 247, 0.2)'
                    : (isSupervisorApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.2)'),
                  border: `2px solid ${isStepRunning ? '#c084fc' : (isSupervisorApproved ? '#10b981' : '#f43f5e')}`,
                  color: isStepRunning ? '#c084fc' : (isSupervisorApproved ? '#34d399' : '#fb7185'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  boxShadow: isStepRunning
                    ? '0 0 15px rgba(168, 85, 247, 0.4)'
                    : (isSupervisorApproved ? '0 0 12px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(244, 63, 94, 0.3)')
                }}>
                  {isStepRunning ? (
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #c084fc', borderTopColor: 'transparent' }} className="animate-spin" />
                  ) : (
                    st.step_num
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', lineHeight: '1.2' }}>
                    {st.name}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: isStepRunning ? '#c084fc' : '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                    {isStepRunning ? (
                      <span className="animate-pulse">Executing...</span>
                    ) : (
                      st.duration
                    )}
                  </div>
                </div>
              </div>

              {/* Column 1: WORKER AGENT */}
              <div
                className={isStepRunning ? 'ai-scan-effect' : ''}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%), rgba(14, 15, 21, 0.92)',
                  border: `1px solid ${isStepRunning ? 'rgba(168, 85, 247, 0.65)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isStepRunning
                    ? '0 0 25px rgba(168, 85, 247, 0.22), inset 0 1px 0 rgba(168, 85, 247, 0.3)'
                    : 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Bot size={13} color="#cbd5e1" />
                    <span>{st.worker.title}</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {st.duration}
                  </span>
                </div>

                {/* Live AI Processing Indicator when step is executing */}
                {isStepRunning && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '6px',
                    padding: '5px 9px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 700, color: '#c084fc' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc' }} className="animate-ping" />
                      <span>AI SYNTHESIS ACTIVE</span>
                    </div>
                    <div style={{ width: '50px', height: '3px', borderRadius: '2px', overflow: 'hidden' }} className="shimmer-active" />
                  </div>
                )}

                {/* Worker Thought Monologue */}
                {st.worker.thought && (
                  <div style={{
                    background: 'rgba(6, 7, 10, 0.75)',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '6px 10px',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.72rem',
                    color: '#cbd5e1',
                    lineHeight: '1.4'
                  }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', marginRight: '4px' }}>Thought:</span>
                    {st.worker.thought}
                  </div>
                )}

                {/* Planned Steps or Tool Call */}
                {st.worker.tool_call && (
                  <div style={{
                    background: 'rgba(6, 7, 10, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    color: '#e2e8f0'
                  }}>
                    <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>
                      Tool Call: {st.worker.tool_call.tool}
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
                      {JSON.stringify(st.worker.tool_call, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Planned Steps List */}
                {st.worker.planned_steps && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '2px' }}>Planned Steps:</div>
                    {st.worker.planned_steps.map((ps, pi) => (
                      <div key={pi} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>•</span>
                        <span>{ps}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Output Snippet */}
                {st.worker.output_preview && (
                  <div style={{
                    background: 'rgba(6, 7, 10, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    color: isBlocked ? '#fb7185' : '#34d399'
                  }}>
                    <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>Command Output (partial):</div>
                    {st.worker.output_preview}
                  </div>
                )}
              </div>

              {/* Column 2: ML SECURITY CHECK */}
              <div
                className={isStepRunning ? 'ai-scan-effect' : ''}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%), rgba(14, 15, 21, 0.92)',
                  border: `1px solid ${isStepRunning ? 'rgba(6, 182, 212, 0.5)' : (isHighRisk ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 185, 129, 0.35)')}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isStepRunning
                    ? '0 0 20px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(6, 182, 212, 0.25)'
                    : (isHighRisk ? '0 0 20px rgba(244, 63, 94, 0.18)' : 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 20px rgba(0, 0, 0, 0.5)')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={13} color="#10b981" />
                    <span>ML Security Check</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace' }}>
                    &lt; 2ms
                  </span>
                </div>

                {/* Model Scores Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                  
                  {/* Isolation Forest */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Isolation Forest</span>
                      <span style={{ fontWeight: 700, color: (st.ml_check?.isolation_forest || 0.28) > 0.5 ? '#f43f5e' : '#10b981' }}>
                        {(st.ml_check?.isolation_forest || 0.28).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(8, (st.ml_check?.isolation_forest || 0.28) * 100)}%`,
                        height: '100%',
                        background: (st.ml_check?.isolation_forest || 0.28) > 0.5 ? '#f43f5e' : '#10b981'
                      }} />
                    </div>
                  </div>

                  {/* Decision Tree */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Decision Tree</span>
                      <span style={{ fontWeight: 700, color: (st.ml_check?.decision_tree || 0.04) > 0.5 ? '#f43f5e' : '#10b981' }}>
                        {(st.ml_check?.decision_tree || 0.04).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(8, (st.ml_check?.decision_tree || 0.04) * 100)}%`,
                        height: '100%',
                        background: (st.ml_check?.decision_tree || 0.04) > 0.5 ? '#f43f5e' : '#10b981'
                      }} />
                    </div>
                  </div>

                  {/* Action Classifier */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '2px' }}>
                      <span>Action Classifier</span>
                      <span style={{ fontWeight: 700, color: (st.ml_check?.action_classifier || 0.09) > 0.5 ? '#f43f5e' : '#10b981' }}>
                        {(st.ml_check?.action_classifier || 0.09).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.max(8, (st.ml_check?.action_classifier || 0.09) * 100)}%`,
                        height: '100%',
                        background: (st.ml_check?.action_classifier || 0.09) > 0.5 ? '#f43f5e' : '#10b981'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Overall Risk Score Badge */}
                <div style={{
                  marginTop: 'auto',
                  background: riskBg,
                  border: `1px solid ${riskBadgeColor}`,
                  borderRadius: '7px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: `0 0 10px ${riskBadgeColor}33`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: riskBadgeColor }}>
                    {isHighRisk ? <AlertTriangle size={14} color="#f43f5e" /> : <ShieldCheck size={14} color="#10b981" />}
                    <span>{isStepRunning ? 'Live Risk Telemetry' : 'Overall Risk Score'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: riskBadgeColor }}>
                    {(st.ml_check?.overall_risk || 0.14).toFixed(2)} ({isStepRunning ? 'Evaluating' : (st.ml_check?.risk_level || 'Low')})
                  </div>
                </div>
              </div>

              {/* Column 3: SUPERVISING AGENT */}
              <div
                className={isStepRunning ? 'ai-scan-effect' : ''}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.005) 100%), rgba(14, 15, 21, 0.92)',
                  border: `1px solid ${isSupervisorApproved ? 'rgba(16, 185, 129, 0.35)' : (isStepRunning ? 'rgba(168, 85, 247, 0.55)' : 'rgba(244, 63, 94, 0.55)')}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isStepRunning
                    ? '0 0 20px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(168, 85, 247, 0.25)'
                    : (isSupervisorApproved ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 8px 20px rgba(0, 0, 0, 0.5)' : '0 0 20px rgba(244, 63, 94, 0.2)')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={13} color="#a855f7" />
                    <span>{st.supervisor?.title || 'Security Boundary'}</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: isStepRunning ? '#c084fc' : '#64748b', fontFamily: 'monospace' }}>
                    {isStepRunning ? 'Evaluating' : (st.duration || '1.1s')}
                  </span>
                </div>

                {/* Diagnostic Analysis */}
                <div style={{
                  fontSize: '0.72rem',
                  color: '#cbd5e1',
                  lineHeight: '1.45',
                  flex: 1
                }}>
                  <div style={{ fontWeight: 600, color: '#a855f7', marginBottom: '2px' }}>Analysis:</div>
                  {st.supervisor?.analysis || 'Supervisor monitoring request parameters against SIT Pune security policy...'}
                </div>

                {/* Sovereign Decision Pill */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  background: isStepRunning
                    ? 'rgba(168, 85, 247, 0.12)'
                    : (isSupervisorApproved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.15)'),
                  border: `1px solid ${isStepRunning ? 'rgba(168, 85, 247, 0.45)' : (isSupervisorApproved ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.55)')}`,
                  color: isStepRunning ? '#c084fc' : (isSupervisorApproved ? '#34d399' : '#fb7185'),
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  boxShadow: isStepRunning
                    ? '0 0 12px rgba(168, 85, 247, 0.2)'
                    : (isSupervisorApproved ? '0 0 12px rgba(16, 185, 129, 0.15)' : '0 0 15px rgba(244, 63, 94, 0.2)')
                }}>
                  {isStepRunning ? (
                    <>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc' }} className="animate-ping" />
                      <span>{st.supervisor?.badge_text || 'Evaluating Policy...'}</span>
                    </>
                  ) : isSupervisorApproved ? (
                    <>
                      <CheckCircle size={13} color="#10b981" />
                      <span>{st.supervisor?.badge_text || 'Approved'}</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={13} color="#f43f5e" />
                      <span>{st.supervisor?.badge_text || 'Access Halted'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          6. SOVEREIGN FINAL OUTCOME CARD (Task Blocked or Task Completed)
          ===================================================================== */}
      {finalOutcome && (
        finalOutcome.is_blocked ? (
          /* BLOCKED BANNER */
          <div style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(10, 11, 15, 0.96) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.65)',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 0 35px rgba(244, 63, 94, 0.25), inset 0 1px 0 rgba(244, 63, 94, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '2px solid #f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f43f5e',
                  boxShadow: '0 0 15px rgba(244, 63, 94, 0.4)'
                }}>
                  <XCircle size={22} color="#f43f5e" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fb7185', margin: 0 }}>
                    {finalOutcome.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '4px 0 0' }}>
                    {finalOutcome.summary}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                {finalOutcome.duration}
              </span>
            </div>

            {/* Sub-cards Row (Response Withheld | Reason) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              
              {/* Left Sub-card: Response Withheld */}
              <div style={{
                background: 'rgba(6, 7, 10, 0.75)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <EyeOff size={18} color="#f43f5e" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb7185' }}>
                    Response Withheld
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                    {finalOutcome.withheld_message || 'This response contains sensitive information and has been blocked by the supervising agent.'}
                  </div>
                </div>
              </div>

              {/* Right Sub-card: Specific Reasons */}
              <div style={{
                background: 'rgba(6, 7, 10, 0.75)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb7185', marginBottom: '8px' }}>
                  Reason & Enforcement Details:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(finalOutcome.reasons || [
                    'High risk action detected',
                    'Violates campus security policy',
                    'Attempted unauthorized file access'
                  ]).map((r, ri) => (
                    <div key={ri} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.73rem', color: '#cbd5e1' }}>
                      <XCircle size={13} color="#f43f5e" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* COMPLETED BANNER */
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(10, 11, 15, 0.96) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.55)',
            borderRadius: '14px',
            padding: '22px',
            boxShadow: '0 0 35px rgba(16, 185, 129, 0.18), inset 0 1px 0 rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.35)'
                }}>
                  <CheckCircle size={22} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', margin: 0 }}>
                    {finalOutcome.title}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '4px 0 0' }}>
                    {finalOutcome.summary}
                  </p>
                </div>
              </div>

              {/* Execution Metrics Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Total Steps</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                    {finalOutcome.total_steps || 4}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Total Time</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                    {finalOutcome.total_time || '14.2s'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Final Risk Score</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399' }}>
                    {finalOutcome.final_risk_score !== undefined ? finalOutcome.final_risk_score.toFixed(2) : '0.03'} (Low)
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverable Preview */}
            {(finalOutcome.deliverable_preview || currentTurn?.delivered_response) && (
              <div style={{
                background: 'rgba(6, 7, 10, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '10px',
                padding: '14px',
                marginTop: '14px',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Verified Deliverable Output:
                    </span>
                    {(finalOutcome.file_path || currentTurn?.target) && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        fontFamily: 'monospace'
                      }}>
                        {finalOutcome.file_path || currentTurn?.target}
                      </span>
                    )}
                    {finalOutcome.total_records !== undefined && finalOutcome.total_records !== null && (
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.45)',
                        color: '#34d399',
                        fontWeight: 700
                      }}>
                        Full File • {finalOutcome.total_records} Records
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleCopy(finalOutcome.deliverable_preview || currentTurn?.delivered_response || '')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#e2e8f0',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Copy complete deliverable content"
                    >
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy All'}</span>
                    </button>
                    {(finalOutcome.is_file || (finalOutcome.file_path && String(finalOutcome.file_path).endsWith('.csv'))) && (
                      <button
                        onClick={() => {
                          const content = finalOutcome.deliverable_preview || currentTurn?.delivered_response || '';
                          const pathStr = String(finalOutcome.file_path || 'export.csv');
                          const fname = pathStr.split('/').pop() || 'export.csv';
                          const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', fname);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34d399',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="Download full file as CSV"
                      >
                        <Download size={12} />
                        <span>Download CSV</span>
                      </button>
                    )}
                  </div>
                </div>
                {(() => {
                  const text = finalOutcome.deliverable_preview || currentTurn?.delivered_response || '';
                  const lines = text.trim().split('\n');
                  const isTable = (text.includes(',') && lines.length > 1) || (text.includes('|') && lines.length > 1);
                  if (isTable) {
                    const pathStr = String(finalOutcome.file_path || currentTurn?.target || 'data.csv');
                    const fname = pathStr.split('/').pop() || 'data.csv';
                    return <CsvTableView content={text} filename={fname} maxHeight="360px" />;
                  }
                  return (
                    <pre style={{
                      margin: 0,
                      fontSize: '0.74rem',
                      fontFamily: 'Inter, sans-serif',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.45',
                      maxHeight: '360px',
                      overflowY: 'auto'
                    }}>
                      {text}
                    </pre>
                  );
                })()}
              </div>
            )}
          </div>
        )
      )}

    </div>
  );
}
