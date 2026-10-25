import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050507',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px',
        textAlign: 'center',
        padding: '40px',
        background: 'rgba(15, 16, 22, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f43f5e', margin: '0 0 10px' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 12px' }}>Page Not Found</h2>
        <p style={{ fontSize: '0.86rem', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 24px' }}>
          The requested path is not accessible within the SIT Workspace Agent environment.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#ffffff',
            padding: '10px 24px',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none'
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
