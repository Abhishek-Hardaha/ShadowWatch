'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Table,
  Code,
  Database,
  ShieldAlert,
  Key,
  Mail,
  Lock,
  Search,
  Copy,
  Check,
  Layers,
  HardDrive,
  FileSpreadsheet,
  FileCode,
  Expand,
  Minimize2,
  ShieldCheck,
  Eye
} from 'lucide-react';
import CsvTableView from './CsvTableView';

interface WorkspaceBrowserModalProps {
  onClose: () => void;
}

interface FileItem {
  path: string;
  filename: string;
  size_bytes: number;
  directory: string;
  extension: string;
  is_confidential: boolean;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: { [name: string]: TreeNode };
  fileData?: FileItem;
}

export default function WorkspaceBrowserModal({ onClose }: WorkspaceBrowserModalProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isCsv = Boolean(
    selectedFile && (
      selectedFile.filename?.toLowerCase().endsWith('.csv') ||
      selectedFile.path?.toLowerCase().endsWith('.csv') ||
      (fileContent && fileContent.includes(',') && fileContent.split('\n')[0].includes(','))
    )
  );
  
  // Track open/collapsed folders
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'Academic': true,
    'Academic/Syllabus': true,
    'Academic/Question_Papers': false,
    'Academic/Lecture_Notes': false,
    'Academic/Assignments': false,
    'Academic/Marks_&_Results': false,
    'Administration': false,
    'Faculty': false,
    'Students': false,
    'Research': false,
    'Finance': false,
    'General_Files': false,
    'Emails': false,
    'System_Files': false,
  });

  useEffect(() => {
    fetch('/api/workspace/files')
      .then((res) => res.json())
      .then((data) => {
        const fileList: FileItem[] = data.files || [];
        setFiles(fileList);
        if (fileList.length > 0) {
          // Select default file (e.g. CS701 syllabus)
          const defaultFile = fileList.find(f => f.path.includes('CS701_Deep_Learning_Syllabus')) || fileList[0];
          handleSelectFile(defaultFile);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSelectFile = (f: FileItem) => {
    setSelectedFile(f);
    setIsLoadingContent(true);
    fetch(`/api/workspace/file_content?path=${encodeURIComponent(f.path)}`)
      .then((res) => res.json())
      .then((data) => {
        setFileContent(data.content || '');
        setIsLoadingContent(false);
      })
      .catch((err) => {
        setFileContent('Error loading content.');
        setIsLoadingContent(false);
      });
  };

  const toggleFolder = (folderPath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    files.forEach((f) => {
      const parts = f.path.split('/');
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        allExpanded[current] = true;
      }
    });
    setExpandedFolders(allExpanded);
  };

  const collapseAll = () => {
    setExpandedFolders({});
  };

  // Build hierarchical folder tree from flat file list
  const treeRoot = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      isFolder: true,
      children: {}
    };

    const targetFiles = search.trim()
      ? files.filter(f => f.path.toLowerCase().includes(search.toLowerCase()) || f.filename.toLowerCase().includes(search.toLowerCase()))
      : files;

    targetFiles.forEach((file) => {
      const parts = file.path.split('/');
      let currentNode = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!currentNode.children[part]) {
          currentNode.children[part] = {
            name: part,
            path: currentPath,
            isFolder: !isFile,
            children: {},
            fileData: isFile ? file : undefined
          };
        }
        currentNode = currentNode.children[part];
      }
    });

    return root;
  }, [files, search]);

  // When search changes, auto-expand matching folders
  useEffect(() => {
    if (search.trim()) {
      const autoExpand: Record<string, boolean> = {};
      files.forEach(f => {
        if (f.path.toLowerCase().includes(search.toLowerCase())) {
          const parts = f.path.split('/');
          let acc = '';
          for (let i = 0; i < parts.length - 1; i++) {
            acc = acc ? `${acc}/${parts[i]}` : parts[i];
            autoExpand[acc] = true;
          }
        }
      });
      setExpandedFolders(prev => ({ ...prev, ...autoExpand }));
    }
  }, [search, files]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (filename: string, isConfidential: boolean) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.txt')) {
      return <FileText size={15} color="#38bdf8" />;
    }
    if (lower.endsWith('.csv')) {
      return <FileSpreadsheet size={15} color="#10b981" />;
    }
    if (lower.endsWith('.json')) {
      return <Code size={15} color="#f59e0b" />;
    }
    if (lower.endsWith('.sqlite') || lower.endsWith('.db')) {
      return <Database size={15} color="#c084fc" />;
    }
    if (lower.endsWith('.env') || lower.endsWith('.conf') || lower.endsWith('.sh')) {
      return <Key size={15} color="#f43f5e" />;
    }
    if (lower.endsWith('.eml')) {
      return <Mail size={15} color="#14b8a6" />;
    }
    return <FileText size={15} color="#94a3b8" />;
  };

  // Recursive tree renderer
  const renderTree = (node: TreeNode, depth: number = 0) => {
    // Sort keys: folders first (alphabetical), then files
    const sortedKeys = Object.keys(node.children).sort((a, b) => {
      const aIsFolder = node.children[a].isFolder;
      const bIsFolder = node.children[b].isFolder;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => {
      const child = node.children[key];
      const isExpanded = !!expandedFolders[child.path];
      const isSelected = selectedFile?.path === child.path;

      if (child.isFolder) {
        // Special color for Marks & Results or sensitive directories
        const isMarksFolder = child.name.toLowerCase().includes('marks');
        const isAcademic = child.name === 'Academic';
        const folderColor = isMarksFolder ? '#06b6d4' : '#f59e0b';

        return (
          <div key={child.path} style={{ userSelect: 'none' }}>
            <div
              onClick={(e) => toggleFolder(child.path, e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 10px',
                paddingLeft: `${depth * 18 + 10}px`,
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
                color: '#e2e8f0',
                background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                fontWeight: depth === 0 ? 700 : 600,
                fontSize: depth === 0 ? '0.85rem' : '0.80rem'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent')}
            >
              {/* Expand / Collapse Chevron */}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: '#94a3b8' }}>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>

              {/* Folder Icon */}
              {isExpanded ? (
                <FolderOpen size={16} color={folderColor} />
              ) : (
                <Folder size={16} color={folderColor} />
              )}

              {/* Folder Name */}
              <span style={{ color: depth === 0 ? '#f8fafc' : '#cbd5e1' }}>
                {child.name.replace(/_/g, ' ')}
              </span>

              {/* Item Count Pill */}
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.65rem',
                color: '#64748b',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {Object.keys(child.children).length}
              </span>
            </div>

            {/* Render children if expanded */}
            {isExpanded && (
              <div style={{ position: 'relative' }}>
                {/* Visual branch guide line */}
                <div style={{
                  position: 'absolute',
                  left: `${depth * 18 + 17}px`,
                  top: 0,
                  bottom: '6px',
                  width: '1px',
                  background: 'rgba(255, 255, 255, 0.08)'
                }} />
                {renderTree(child, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        // File item
        const file = child.fileData!;
        return (
          <div
            key={file.path}
            onClick={() => handleSelectFile(file)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              paddingLeft: `${depth * 18 + 16}px`,
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
              background: isSelected
                ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.22), rgba(56, 189, 248, 0.05))'
                : 'transparent',
              borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
              color: isSelected ? '#38bdf8' : '#cbd5e1',
              fontSize: '0.78rem'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* File Extension Icon */}
            {getFileIcon(file.filename, file.is_confidential)}

            {/* File Name */}
            <span style={{
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: isSelected ? 700 : 400
            }}>
              {file.filename}
            </span>

            {/* Confidential Badge or Size */}
            {file.is_confidential ? (
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Lock size={9} />
                CONFIDENTIAL
              </span>
            ) : (
              <span style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'monospace' }}>
                {(file.size_bytes / 1024).toFixed(1)}k
              </span>
            )}
          </div>
        );
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '96%',
          maxWidth: '1240px',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.008) 100%), rgba(11, 12, 17, 0.97)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '18px',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 35px 80px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(14, 15, 21, 0.96)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #1c1e28, #101117)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 6px 15px rgba(0, 0, 0, 0.6)'
            }}>
              <HardDrive size={20} color="#f8fafc" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Symbiosis Institute of Technology — Multi-File Sandbox Explorer
                </h2>
                <span className="badge-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  {files.length} AUTHENTIC CAMPUS FILES
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                Complete institutional file system containing academic syllabi, embargoed exam papers, marks, faculty records, and production secrets.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Split: Left Tree Navigation, Right Content Preview */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Interactive Collapsible Folder Tree */}
          <div style={{
            width: '380px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(12, 13, 18, 0.96)',
            flexShrink: 0
          }}>
            {/* Search & Collapse All / Expand All Controls */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Filter files (syllabus, marks, exam, .env)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '7px',
                    padding: '8px 10px 8px 32px',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    outline: 'none'
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Tree Quick Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ fontSize: '0.70rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  WORKSPACE FOLDERS
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={expandAll}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Expand all folders"
                  >
                    <Expand size={11} /> Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Collapse all folders"
                  >
                    <Minimize2 size={11} /> Collapse
                  </button>
                </div>
              </div>
            </div>

            {/* Folder Tree Scrollable Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 6px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              {renderTree(treeRoot)}
            </div>
          </div>

          {/* Right Column: High-Quality File Content Preview */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#07070a',
            overflow: 'hidden'
          }}>
            {selectedFile ? (
              <>
                {/* File Viewer Header */}
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(14, 15, 21, 0.88)'
                }}>
                  {/* Breadcrumb Path & Badges */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b', marginBottom: '4px' }}>
                      {selectedFile.path.split('/').map((part, idx, arr) => (
                        <React.Fragment key={idx}>
                          <span style={{ color: idx === arr.length - 1 ? '#38bdf8' : '#94a3b8', fontWeight: idx === arr.length - 1 ? 700 : 400 }}>
                            {part}
                          </span>
                          {idx < arr.length - 1 && <span>/</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 style={{ fontSize: '1.0rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getFileIcon(selectedFile.filename, selectedFile.is_confidential)}
                        {selectedFile.filename}
                      </h3>

                      {selectedFile.is_confidential ? (
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          color: '#ef4444',
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldAlert size={12} />
                          STRICTLY CONFIDENTIAL / RESTRICTED
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.66rem',
                          fontWeight: 700,
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <ShieldCheck size={12} />
                          PUBLIC ACADEMIC RESOURCE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Copy Button & File Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#64748b' }}>
                      <div>Size: <strong style={{ color: '#cbd5e1' }}>{selectedFile.size_bytes.toLocaleString()} bytes</strong></div>
                      <div>Format: <strong style={{ color: '#cbd5e1' }}>{selectedFile.extension.toUpperCase() || 'FILE'}</strong></div>
                    </div>

                    <button
                      onClick={handleCopy}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                        border: copied ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.4)',
                        color: copied ? '#10b981' : '#38bdf8',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy File'}
                    </button>
                  </div>
                </div>

                {/* Content Area with Line Numbers OR Interactive CSV Table */}
                <div style={{ flex: 1, overflow: 'auto', padding: isCsv ? '0' : '16px 20px', background: '#07070a', display: 'flex', flexDirection: 'column' }}>
                  {isLoadingContent ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '8px' }}>
                      <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      Loading file contents...
                    </div>
                  ) : isCsv ? (
                    <CsvTableView content={fileContent} filename={selectedFile.filename} />
                  ) : (
                    <pre style={{
                      margin: 0,
                      fontFamily: '"JetBrains Mono", Consolas, "Courier New", monospace',
                      fontSize: '0.82rem',
                      lineHeight: '1.6',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {fileContent}
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '10px' }}>
                <Folder size={42} color="#334155" />
                <p style={{ fontSize: '0.85rem' }}>Select any file on the left to preview its authentic content</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
