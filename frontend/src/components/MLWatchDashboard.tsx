'use client';

import React, { useMemo } from 'react';
import { Activity, BarChart3, Database } from 'lucide-react';

export interface ActionRecord {
  id: string;
  actionNumber: number;
  timestamp: string; // e.g. "15:22"
  riskScore: number; // 0.0 - 1.0
  isoScore: number;  // 0.0 - 1.0
  dtScore: number;   // 0.0 - 1.0
  tool: string;      // "read_file" | "list_directory" | "sql_query" | "write_file" | "delete_file" | "other"
  target?: string;
}

interface MLWatchDashboardProps {
  actions?: ActionRecord[];
}

export default function MLWatchDashboard({
  actions = []
}: MLWatchDashboardProps) {

  // =========================================================================
  // 1. CHART 1: RISK SCORE OVER TIME (SVG Line + Peak Gradient Fill)
  // =========================================================================
  const chart1Width = 380;
  const chart1Height = 150;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;
  const plotWidth = chart1Width - padLeft - padRight;
  const plotHeight = chart1Height - padTop - padBottom;

  // Real actions recorded in session
  const displayPoints = useMemo(() => {
    if (actions.length <= 18) return actions;
    return actions.slice(-18);
  }, [actions]);

  const stepX = displayPoints.length > 1 ? plotWidth / (displayPoints.length - 1) : plotWidth / 2;

  const getCoord = (idx: number, score: number) => {
    const x = padLeft + (displayPoints.length === 1 ? plotWidth / 2 : idx * stepX);
    const y = padTop + plotHeight - score * plotHeight;
    return { x, y };
  };

  // Build line path
  const linePathD = displayPoints.map((pt, idx) => {
    const { x, y } = getCoord(idx, pt.riskScore);
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Peak area fill (around spike where score >= 0.5)
  const peakStartIndex = displayPoints.findIndex(p => p.riskScore >= 0.5);
  const peakEndIndex = displayPoints.length - 1 - [...displayPoints].reverse().findIndex(p => p.riskScore >= 0.5);

  let peakAreaD = '';
  if (peakStartIndex >= 0 && peakEndIndex >= peakStartIndex) {
    const startX = padLeft + peakStartIndex * stepX;
    const endX = padLeft + peakEndIndex * stepX;
    const baseLineY = padTop + plotHeight;
    
    const peakPts = displayPoints.slice(peakStartIndex, peakEndIndex + 1).map((pt, i) => {
      const { x, y } = getCoord(peakStartIndex + i, pt.riskScore);
      return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

    peakAreaD = `M ${startX.toFixed(1)} ${baseLineY} ${peakPts} L ${endX.toFixed(1)} ${baseLineY} Z`;
  }

  // Threshold Y coordinate for 0.7 line
  const thresholdY = padTop + plotHeight - 0.7 * plotHeight;

  // Selected timestamps for x-axis ticks
  const timeTicks = useMemo(() => {
    if (displayPoints.length === 0) return [];
    if (displayPoints.length === 1) {
      return [{ label: displayPoints[0].timestamp, x: padLeft + plotWidth / 2 }];
    }
    const count = Math.min(5, displayPoints.length);
    const result = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (displayPoints.length - 1));
      result.push({
        label: displayPoints[idx].timestamp,
        x: padLeft + idx * stepX
      });
    }
    return result;
  }, [displayPoints, stepX, padLeft, plotWidth]);

  // =========================================================================
  // 2. CHART 2: MODEL RISK COMPARISON (Paired Bar Chart: IsoForest vs DecisionTree)
  // =========================================================================
  const chart2Width = 380;
  const chart2Height = 150;
  const c2PadLeft = 32;
  const c2PadRight = 16;
  const c2PadTop = 18;
  const c2PadBottom = 26;
  const c2PlotWidth = chart2Width - c2PadLeft - c2PadRight;
  const c2PlotHeight = chart2Height - c2PadTop - c2PadBottom;

  const barDisplayActions = useMemo(() => {
    return actions.slice(-30);
  }, [actions]);

  const barCount = barDisplayActions.length;
  const slotWidth = c2PlotWidth / Math.max(1, barCount);
  const singleBarWidth = Math.max(3, Math.min(8, (slotWidth - 2) / 2));

  // =========================================================================
  // 3. CHART 3: ACTION TYPE DISTRIBUTION (Donut Ring + Center Number)
  // =========================================================================
  const toolColors: Record<string, string> = {
    read_file: '#38bdf8',      // Sky Blue
    list_directory: '#10b981', // Emerald Green
    sql_query: '#a855f7',      // Purple
    write_file: '#f97316',     // Orange
    delete_file: '#f59e0b',    // Yellow/Amber
    other: '#64748b'           // Slate
  };

  const toolLabels: Record<string, string> = {
    read_file: 'read_file',
    list_directory: 'list_directory',
    sql_query: 'sql_query',
    write_file: 'write_file',
    delete_file: 'delete_file',
    other: 'other'
  };

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {
      read_file: 0,
      list_directory: 0,
      sql_query: 0,
      write_file: 0,
      delete_file: 0,
      other: 0
    };

    actions.forEach(a => {
      const t = a.tool || 'other';
      if (counts[t] !== undefined) {
        counts[t] += 1;
      } else {
        counts.other += 1;
      }
    });

    const total = actions.length || 0;
    let accumulated = 0;
    const slices = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([tool, count]) => {
        const fraction = total > 0 ? count / total : 0;
        const start = accumulated;
        accumulated += fraction;
        return {
          tool,
          label: toolLabels[tool] || tool,
          count,
          fraction,
          startFraction: start,
          color: toolColors[tool] || '#94a3b8'
        };
      });

    return { counts, total: actions.length, slices };
  }, [actions]);

  const donutSize = 130;
  const radius = 48;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <section style={{
      marginBottom: '36px',
      marginTop: '10px'
    }}>
      
      {/* 3-Card Grid Matching User Reference Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '14px'
      }}>

        {/* ===================================================================
            CARD 1: RISK SCORE OVER TIME
            =================================================================== */}
        <div className="liquid-glass" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(12, 13, 18, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 14px 35px -10px rgba(0, 0, 0, 0.85)'
        }}>
          {/* Card Header & Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Risk Score Over Time
            </h3>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                Risk Score
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '2px', backgroundColor: '#ef4444', borderTop: '1px dashed #ef4444' }} />
                Threshold (0.7)
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg
              width="100%"
              height={chart1Height}
              viewBox={`0 0 ${chart1Width} ${chart1Height}`}
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="peakGlowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#ef4444" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels */}
              {[1.0, 0.5, 0.0].map((val) => {
                const y = padTop + plotHeight - val * plotHeight;
                return (
                  <React.Fragment key={val}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={chart1Width - padRight}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(1)}
                    </text>
                  </React.Fragment>
                );
              })}

              {/* Red Dashed Threshold Line (0.7) */}
              <line
                x1={padLeft}
                y1={thresholdY}
                x2={chart1Width - padRight}
                y2={thresholdY}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />

              {actions.length === 0 ? (
                // Clean Zero-Placeholder State
                <text
                  x={padLeft + plotWidth / 2}
                  y={padTop + plotHeight / 2 + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  Awaiting live agent actions — submit a query above
                </text>
              ) : (
                <>
                  {/* Peak Area Gradient Fill */}
                  {peakAreaD && (
                    <path d={peakAreaD} fill="url(#peakGlowGrad)" />
                  )}

                  {/* Connective Line */}
                  {displayPoints.length > 1 && (
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Point Dots */}
                  {displayPoints.map((pt, idx) => {
                    const { x, y } = getCoord(idx, pt.riskScore);
                    const isElevated = pt.riskScore >= 0.5;
                    const isSpike = pt.riskScore >= 0.7;
                    const dotColor = isSpike ? '#ef4444' : isElevated ? '#f97316' : '#38bdf8';

                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r={isSpike ? 5 : 4}
                        fill={dotColor}
                        stroke="#0b1220"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* X-Axis Ticks (Timestamps) */}
                  {timeTicks.map((t, idx) => (
                    <text
                      key={idx}
                      x={t.x}
                      y={chart1Height - 8}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {t.label}
                    </text>
                  ))}
                </>
              )}
            </svg>
          </div>
        </div>

        {/* ===================================================================
            CARD 2: MODEL RISK COMPARISON (Paired Bar Chart: IsoForest vs DT)
            =================================================================== */}
        <div className="liquid-glass" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(12, 13, 18, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 14px 35px -10px rgba(0, 0, 0, 0.85)'
        }}>
          {/* Header & Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Model Risk Comparison
            </h3>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.68rem', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#38bdf8', borderRadius: '2px' }} />
                Isolation Forest
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#a855f7', borderRadius: '2px' }} />
                Decision Tree
              </span>
            </div>
          </div>

          {/* SVG Paired Bar Chart */}
          <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg
              width="100%"
              height={chart2Height}
              viewBox={`0 0 ${chart2Width} ${chart2Height}`}
              style={{ overflow: 'visible' }}
            >
              {/* Y-Axis Grid Lines & Labels */}
              {[1.0, 0.5, 0.0].map((val) => {
                const y = c2PadTop + c2PlotHeight - val * c2PlotHeight;
                return (
                  <React.Fragment key={val}>
                    <line
                      x1={c2PadLeft}
                      y1={y}
                      x2={chart2Width - c2PadRight}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeWidth="1"
                    />
                    <text
                      x={c2PadLeft - 8}
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(1)}
                    </text>
                  </React.Fragment>
                );
              })}

              {actions.length === 0 ? (
                // Clean Zero-Placeholder State
                <text
                  x={c2PadLeft + c2PlotWidth / 2}
                  y={c2PadTop + c2PlotHeight / 2 + 3}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="middle"
                >
                  Awaiting live agent actions — zero placeholder data
                </text>
              ) : (
                <>
                  {/* Paired Vertical Bars for each Action */}
                  {barDisplayActions.map((action, i) => {
                    const slotX = c2PadLeft + i * slotWidth;
                    const baseY = c2PadTop + c2PlotHeight;

                    // Bar 1: Isolation Forest (Blue)
                    const hIso = Math.max(3, action.isoScore * c2PlotHeight);
                    const yIso = baseY - hIso;
                    const xIso = slotX + (slotWidth - singleBarWidth * 2 - 2) / 2;

                    // Bar 2: Decision Tree (Purple)
                    const hDt = Math.max(3, action.dtScore * c2PlotHeight);
                    const yDt = baseY - hDt;
                    const xDt = xIso + singleBarWidth + 1.5;

                    return (
                      <g key={action.id || i}>
                        <rect
                          x={xIso}
                          y={yIso}
                          width={singleBarWidth}
                          height={hIso}
                          fill="#38bdf8"
                          rx="1"
                        />
                        <rect
                          x={xDt}
                          y={yDt}
                          width={singleBarWidth}
                          height={hDt}
                          fill="#a855f7"
                          rx="1"
                        />
                      </g>
                    );
                  })}

                  {/* X-Axis Ticks (1, 5, 10...) */}
                  {[1, 5, 10, 15, 20, 25, 30].map((tickVal) => {
                    if (tickVal > barCount) return null;
                    const x = c2PadLeft + (tickVal - 1) * slotWidth + slotWidth / 2;
                    return (
                      <text
                        key={tickVal}
                        x={x}
                        y={chart2Height - 12}
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {tickVal}
                      </text>
                    );
                  })}

                  <text
                    x={c2PadLeft + c2PlotWidth / 2}
                    y={chart2Height - 1}
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    Actions
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* ===================================================================
            CARD 3: ACTION TYPE DISTRIBUTION (Donut Chart + Legend)
            =================================================================== */}
        <div className="liquid-glass" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(12, 13, 18, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 14px 35px -10px rgba(0, 0, 0, 0.85)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Action Type Distribution
            </h3>
          </div>

          {/* Donut and Legend Layout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flex: 1,
            gap: '12px'
          }}>
            
            {/* SVG Donut Chart */}
            <div style={{ position: 'relative', width: `${donutSize}px`, height: `${donutSize}px`, flexShrink: 0 }}>
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                style={{ transform: 'rotate(-90deg)' }}
              >
                {/* Background Ring */}
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth={strokeWidth}
                />

                {/* Slices for actual session actions */}
                {distribution.slices.map((slice) => {
                  const strokeDasharray = `${slice.fraction * circumference} ${circumference}`;
                  const strokeDashoffset = -slice.startFraction * circumference;

                  return (
                    <circle
                      key={slice.tool}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  );
                })}
              </svg>

              {/* Center Text (Real Live Count) */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  lineHeight: '1.1',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}>
                  {distribution.total}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  letterSpacing: '0.04em'
                }}>
                  Actions
                </div>
              </div>
            </div>

            {/* Right Legend Chips */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.72rem',
              color: '#cbd5e1'
            }}>
              {distribution.slices.length > 0 ? (
                distribution.slices.map((slice) => (
                  <div key={slice.tool} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      backgroundColor: slice.color,
                      flexShrink: 0
                    }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.70rem', color: '#94a3b8' }}>
                      {slice.label}
                    </span>
                    <span style={{
                      marginLeft: 'auto',
                      fontWeight: 700,
                      color: '#f1f5f9',
                      fontFamily: 'monospace',
                      fontSize: '0.72rem'
                    }}>
                      {slice.count}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.72rem', fontStyle: 'italic' }}>
                  No actions executed yet
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
