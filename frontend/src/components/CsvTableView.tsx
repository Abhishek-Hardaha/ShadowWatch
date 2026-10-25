'use client';

import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  FileText,
  Search,
  Copy,
  Check,
  Download,
  Filter,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface CsvTableViewProps {
  content: string;
  filename?: string;
  maxHeight?: string;
}

/**
 * Versatile tabular parser supporting:
 * 1. Standard CSV (quoted values, commas, escaped quotes)
 * 2. Markdown pipe tables (| col1 | col2 |)
 * 3. CSV with introductory commentary headers
 */
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length === 0) return { headers: [], rows: [] };

  // Check if content is a Markdown table
  const pipeLines = rawLines.filter((l) => l.trim().includes('|'));
  if (pipeLines.length >= 2) {
    const isSeparator = (line: string) => /^[\s|:-]+$/.test(line) && line.includes('-');
    const tableLines = pipeLines.filter((l) => !isSeparator(l.trim()));
    if (tableLines.length > 0) {
      const splitRow = (line: string): string[] => {
        let parts = line.split('|').map((s) => s.trim());
        if (parts.length > 1 && parts[0] === '') parts.shift();
        if (parts.length > 1 && parts[parts.length - 1] === '') parts.pop();
        return parts;
      };

      const headers = splitRow(tableLines[0]);
      const rows: string[][] = [];
      for (let i = 1; i < tableLines.length; i++) {
        const parsed = splitRow(tableLines[i]);
        if (parsed.length > 0 && parsed.some((c) => c !== '')) {
          while (parsed.length < headers.length) parsed.push('');
          rows.push(parsed);
        }
      }
      if (headers.length > 0) {
        return { headers, rows };
      }
    }
  }

  // Otherwise parse as standard CSV
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Find the first line that actually looks like a CSV header (has commas)
  let startIdx = 0;
  while (startIdx < rawLines.length && !rawLines[startIdx].includes(',')) {
    startIdx++;
  }
  if (startIdx >= rawLines.length) {
    return { headers: [rawLines[0].trim()], rows: rawLines.slice(1).map((l) => [l.trim()]) };
  }

  const headers = parseLine(rawLines[startIdx]);
  const rows: string[][] = [];

  for (let i = startIdx + 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const parsed = parseLine(line);
    while (parsed.length < headers.length) {
      parsed.push('');
    }
    rows.push(parsed);
  }

  return { headers, rows };
}

export default function CsvTableView({
  content,
  filename = 'data.csv',
  maxHeight = '650px'
}: CsvTableViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'raw'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const { headers, rows } = useMemo(() => parseCsv(content), [content]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }, [rows, searchQuery]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (sortCol === null) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const valA = a[sortCol] || '';
      const valB = b[sortCol] || '';
      const numA = parseFloat(valA.replace(/[₹$,]/g, ''));
      const numB = parseFloat(valB.replace(/[₹$,]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [filteredRows, sortCol, sortAsc]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (idx: number) => {
    if (sortCol === idx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(idx);
      setSortAsc(true);
    }
  };

  // Cell renderer helper with smart badges
  const renderCell = (val: string, headerName: string) => {
    if (!val) return <span style={{ color: '#475569' }}>—</span>;

    const lowerH = headerName.toLowerCase();
    const isCurrency = val.includes('₹') || val.includes('$') || lowerH.includes('salary') || lowerH.includes('pay') || lowerH.includes('fee');
    const isEmail = val.includes('@') && val.includes('.');
    const isStatus = lowerH.includes('status') || lowerH.includes('defaulter') || lowerH.includes('warning');
    const isID = lowerH.includes('id') || lowerH.includes('prn') || lowerH.includes('code');

    if (isCurrency) {
      return (
        <span style={{ color: '#34d399', fontWeight: 600, fontFamily: 'monospace' }}>
          {val}
        </span>
      );
    }

    if (isEmail) {
      return (
        <span style={{ color: '#38bdf8', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
          {val}
        </span>
      );
    }

    if (isStatus) {
      const isNegative = val.toLowerCase().includes('yes') || val.toLowerCase().includes('warning') || val.toLowerCase().includes('fail') || val.toLowerCase().includes('defaulter') || val === '1';
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: isNegative ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: isNegative ? '#f87171' : '#34d399',
          border: `1px solid ${isNegative ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`
        }}>
          {val}
        </span>
      );
    }

    if (isID) {
      return (
        <span style={{
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '0.74rem',
          color: '#cbd5e1'
        }}>
          {val}
        </span>
      );
    }

    return <span>{val}</span>;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: '#07080b',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 30px rgba(0, 0, 0, 0.8)'
    }}>
      {/* -------------------------------------------------------------
          TOOLBAR HEADER: File Stats, Search, View Mode, Actions
          ------------------------------------------------------------- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        background: 'rgba(14, 15, 21, 0.96)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Info Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#f8fafc',
            fontSize: '0.74rem',
            fontWeight: 700
          }}>
            <TableIcon size={14} />
            <span>Interactive Table View</span>
          </div>

          <span style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '3px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            {sortedRows.length} {sortedRows.length === 1 ? 'row' : 'rows'} · {headers.length} columns
          </span>
        </div>

        {/* Right: Search + View Toggles + Copy/Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Input */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={13} color="#64748b" style={{ position: 'absolute', left: '8px', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '4px 8px 4px 26px',
                fontSize: '0.72rem',
                color: '#f8fafc',
                outline: 'none',
                width: '150px'
              }}
            />
          </div>

          {/* Table / Raw Toggle */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '2px'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'table' ? '#262835' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#94a3b8',
                border: viewMode === 'table' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <TableIcon size={12} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('raw')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: viewMode === 'raw' ? '#262835' : 'transparent',
                color: viewMode === 'raw' ? '#ffffff' : '#94a3b8',
                border: viewMode === 'raw' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              <FileText size={12} />
              <span>Raw</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy entire CSV text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              background: copied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
              color: copied ? '#34d399' : '#cbd5e1',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            title="Download CSV file"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 9px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Download size={12} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          BODY: Table View OR Raw View
          ------------------------------------------------------------- */}
      <div style={{ flex: 1, overflow: 'auto', maxHeight }}>
        {viewMode === 'raw' ? (
          <pre style={{
            margin: 0,
            padding: '16px',
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            fontSize: '0.78rem',
            lineHeight: '1.6',
            color: '#cbd5e1',
            whiteSpace: 'pre-wrap',
            background: '#07080b'
          }}>
            {content}
          </pre>
        ) : (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.75rem',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {/* Sticky Header */}
            <thead>
              <tr style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: '#0e0f14',
                borderBottom: '2px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Index Column */}
                <th style={{
                  padding: '10px 12px',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '45px',
                  borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  #
                </th>
                {headers.map((h, hi) => (
                  <th
                    key={hi}
                    onClick={() => handleSort(hi)}
                    style={{
                      padding: '10px 14px',
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>{h}</span>
                      <ArrowUpDown size={11} color={sortCol === hi ? '#f8fafc' : '#475569'} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 1} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, ri) => (
                  <tr
                    key={ri}
                    style={{
                      background: ri % 2 === 0 ? '#090a0d' : '#0d0e13',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = ri % 2 === 0 ? '#090a0d' : '#0d0e13';
                    }}
                  >
                    {/* Index */}
                    <td style={{
                      padding: '8px 12px',
                      color: '#475569',
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      borderRight: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      {ri + 1}
                    </td>

                    {/* Cells */}
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: '8px 14px',
                          color: '#e2e8f0',
                          lineHeight: '1.45',
                          borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                          whiteSpace: cell.length > 50 ? 'normal' : 'nowrap',
                          maxWidth: '300px'
                        }}
                      >
                        {renderCell(cell, headers[ci] || '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
