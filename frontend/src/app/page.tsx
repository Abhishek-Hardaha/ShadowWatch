'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AgentStatusRibbon from '../components/AgentStatusRibbon';
import ChatSection from '../components/ChatSection';
import ShowcaseTimeline, { TurnRecord, StepDetail } from '../components/ShowcaseTimeline';
import MLWatchDashboard, { ActionRecord } from '../components/MLWatchDashboard';
import CardDetailModal from '../components/CardDetailModal';
import WorkspaceBrowserModal from '../components/WorkspaceBrowserModal';
import EndpointModal from '../components/EndpointModal';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  timestamp: string;
}

export default function Home() {
  const [llmHealth, setLlmHealth] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timelineCards, setTimelineCards] = useState<any[]>([]);
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [lastExecutionTimeMs, setLastExecutionTimeMs] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actions, setActions] = useState<ActionRecord[]>([]);

  const fetchHealth = () => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setLlmHealth(data.llm_endpoint);
        // Automatically ask user to input endpoint link on app open if none configured or inactive
        if (!data.llm_endpoint?.url || !data.llm_endpoint?.active) {
          setIsEndpointModalOpen(true);
        }
      })
      .catch((err) => {
        console.error('Error fetching health:', err);
        setIsEndpointModalOpen(true);
      });
  };

  useEffect(() => {
    fetchHealth();
    // Load real session actions (zero placeholders)
    fetch('/api/ml/session_actions')
      .then((res) => res.json())
      .then((data) => {
        if (data.actions && Array.isArray(data.actions)) {
          setActions(data.actions);
        }
      })
      .catch((err) => console.error('Error fetching session actions:', err));

    // Load real session turns (zero placeholders)
    fetch('/api/agent/session_turns')
      .then((res) => res.json())
      .then((data) => {
        if (data.turns && Array.isArray(data.turns)) {
          setTurns(data.turns);
          if (data.turns.length > 0) {
            setActiveTurnIdx(data.turns.length - 1);
          }
        }
      })
      .catch((err) => console.error('Error fetching session turns:', err));

    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (userPrompt: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userMsg: ChatMessage = {
      role: 'user',
      content: userPrompt,
      timestamp: now
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setTimelineCards([]);

    const startTime = performance.now();

    // Instantly initialize new Turn with Step 1 in running state so execution is 100% live immediately
    const tempTurnId = `turn-${Date.now()}`;
    const initialTurn: TurnRecord = {
      id: tempTurnId,
      turn_number: turns.length + 1,
      timestamp: now,
      user_prompt: userPrompt,
      overall_status: 'RUNNING',
      overall_risk: 0.0,
      steps: [
        {
          step_num: 1,
          name: 'Understand Request',
          duration: 'Executing...',
          worker: {
            title: 'Understand Request',
            thought: 'Worker Agent analyzing prompt semantics, user intent, and workspace resources...'
          },
          ml_check: {
            isolation_forest: 0,
            decision_tree: 0,
            action_classifier: 0,
            overall_risk: 0,
            risk_level: 'Evaluating'
          },
          supervisor: {
            title: 'Security Boundary',
            analysis: 'Supervisor performing pre-triage audit and evaluating access scope...',
            verdict: 'RUNNING',
            badge_text: 'Evaluating...'
          }
        }
      ],
      final_outcome: null as any,
      delivered_response: ''
    };

    setTurns((prev) => {
      const nextTurns = [...prev, initialTurn];
      setActiveTurnIdx(nextTurns.length - 1);
      return nextTurns;
    });

    try {
      const apiBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://127.0.0.1:8008'
        : '';
      const res = await fetch(`${apiBase}/api/agent/run_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Streaming not supported in response body.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const eventType = parsed.event;
            const payload = parsed.payload;

            if (eventType === 'init') {
              setTurns((prev) => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastTurn = { ...updated[updated.length - 1] };
                lastTurn.id = `turn-${payload.turn_number}`;
                lastTurn.turn_number = payload.turn_number;
                lastTurn.timestamp = payload.timestamp;
                updated[updated.length - 1] = lastTurn;
                return updated;
              });
            } else if (eventType === 'step_start') {
              const activeStepPlaceholder: StepDetail = {
                step_num: payload.step_num,
                name: payload.name,
                duration: 'Executing...',
                worker: {
                  title: payload.name,
                  thought: payload.substatus || 'Executing neural inference...'
                },
                ml_check: {
                  isolation_forest: 0,
                  decision_tree: 0,
                  action_classifier: 0,
                  overall_risk: 0,
                  risk_level: 'Evaluating'
                },
                supervisor: {
                  title: 'Security Boundary',
                  analysis: 'Evaluating containment criteria and policies...',
                  verdict: 'RUNNING',
                  badge_text: 'Evaluating...'
                }
              };

              setTurns((prev) => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastTurn = { ...updated[updated.length - 1] };
                const existingStepIdx = lastTurn.steps.findIndex((s) => s.step_num === payload.step_num);
                if (existingStepIdx >= 0) {
                  const newSteps = [...lastTurn.steps];
                  newSteps[existingStepIdx] = activeStepPlaceholder;
                  lastTurn.steps = newSteps;
                } else {
                  lastTurn.steps = [...lastTurn.steps, activeStepPlaceholder];
                }
                updated[updated.length - 1] = lastTurn;
                return updated;
              });
            } else if (eventType === 'step_completed') {
              const completedStep: StepDetail = payload.step;
              setTurns((prev) => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastTurn = { ...updated[updated.length - 1] };
                const existingStepIdx = lastTurn.steps.findIndex((s) => s.step_num === completedStep.step_num);
                if (existingStepIdx >= 0) {
                  const newSteps = [...lastTurn.steps];
                  newSteps[existingStepIdx] = completedStep;
                  lastTurn.steps = newSteps;
                } else {
                  lastTurn.steps = [...lastTurn.steps, completedStep];
                }
                updated[updated.length - 1] = lastTurn;
                return updated;
              });
            } else if (eventType === 'final_outcome') {
              const { final_outcome, final_delivered_response, overall_status, overall_risk, action_point, timeline_cards } = payload;
              
              if (timeline_cards) {
                setTimelineCards(timeline_cards);
              }
              if (action_point) {
                setActions((prev) => [...prev, action_point]);
              }

              setTurns((prev) => {
                if (prev.length === 0) return prev;
                const updated = [...prev];
                const lastTurn = { ...updated[updated.length - 1] };
                lastTurn.final_outcome = final_outcome;
                lastTurn.delivered_response = final_delivered_response;
                lastTurn.overall_status = overall_status;
                lastTurn.overall_risk = overall_risk;
                updated[updated.length - 1] = lastTurn;
                return updated;
              });

              const assistTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: final_delivered_response,
                status: overall_status,
                timestamp: assistTime
              };
              setMessages((prev) => [...prev, assistantMsg]);
            } else if (eventType === 'done') {
              setIsLoading(false);
              const elapsedMs = performance.now() - startTime;
              setLastExecutionTimeMs(elapsedMs);
            }
          } catch (e) {
            console.error('Error parsing SSE event in live stream:', e);
          }
        }
      }
    } catch (err: any) {
      console.warn('Streaming execution fallback to batch:', err);
      try {
        const apiBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
          ? 'http://127.0.0.1:8008'
          : '';
        const fallbackRes = await fetch(`${apiBase}/api/agent/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: userPrompt })
        });
        const data = await fallbackRes.json();
        if (data.all_turns) {
          setTurns(data.all_turns);
          setActiveTurnIdx(data.all_turns.length - 1);
        }
        if (data.timeline_cards) setTimelineCards(data.timeline_cards);
        if (data.action_point) setActions((prev) => [...prev, data.action_point]);
        const assistTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.final_delivered_response || data.error,
            status: data.overall_status,
            timestamp: assistTime
          }
        ]);
      } catch (fallbackErr: any) {
        const assistTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ [ERROR]: ${err.message || 'Operation failed'}`,
            status: 'BLOCKED',
            timestamp: assistTime
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEndpointUrl = async (newUrl: string) => {
    const res = await fetch('/api/config/llm_url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl })
    });
    const data = await res.json();
    setLlmHealth(data.health);
  };

  const handleResetWorkspace = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/workspace/reset', { method: 'POST' });
      setActions([]);
      setTurns([]);
      setActiveTurnIdx(0);
      setTimelineCards([]);
      setMessages([]);
      alert('Sandbox workspace and live session telemetry reset to clean state.');
    } catch (e: any) {
      alert('Error resetting workspace: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '20px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. Header Bar with live Colab LLM Status */}
      <Header
        llmHealth={llmHealth}
        onOpenEndpointModal={() => setIsEndpointModalOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
        onResetWorkspace={handleResetWorkspace}
        isResetting={isResetting}
      />

      {/* 2. Top Chat Section */}
      <ChatSection
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />

      {/* 3. Middle: 3-Column Multi-Step Execution Inspector */}
      <ShowcaseTimeline
        turns={turns}
        activeTurnIndex={activeTurnIdx}
        onSelectTurn={(idx) => setActiveTurnIdx(idx)}
        isRunning={isLoading}
        cards={timelineCards}
        onSelectCard={(card) => setSelectedCard(card)}
      />

      {/* 4. Bottom 3-Panel Surveillance Deck (Worker Agent | ML Anomaly Detection | Supervising Agent) */}
      <AgentStatusRibbon
        isLoading={isLoading}
        actions={actions}
        isLlmActive={Boolean(llmHealth?.active)}
        lastExecutionTimeMs={lastExecutionTimeMs}
      />

      {/* 5. Very Bottom: Live ML Watch Dashboard Matching Reference Design */}
      <MLWatchDashboard actions={actions} />

      {/* Modals & Drawers */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {isWorkspaceModalOpen && (
        <WorkspaceBrowserModal
          onClose={() => setIsWorkspaceModalOpen(false)}
        />
      )}

      {isEndpointModalOpen && (
        <EndpointModal
          currentUrl={llmHealth?.url || ''}
          llmHealth={llmHealth}
          onClose={() => setIsEndpointModalOpen(false)}
          onUpdateUrl={handleUpdateEndpointUrl}
        />
      )}

    </main>
  );
}
