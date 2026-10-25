import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIT Workspace Agent | Autonomous Academic Security & Intelligence Platform',
  description: 'Interactive, transparent cybersecurity platform exposing autonomous AI agent thoughts, ML anomaly detection, and independent dual-checkpoint LLM supervision in real time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
