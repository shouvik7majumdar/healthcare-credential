import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/navigation/Header';
import { SystemStatusBar } from '../components/navigation/SystemStatusBar';
import { WalletProvider } from '../context/WalletContext';
import { MedProofDataProvider } from '../context/MedProofDataContext';

export const metadata: Metadata = {
  title: 'MedProof — Confidential Healthcare Credential & Consent Exchange',
  description:
    'Privacy-preserving healthcare credential issuance, consent management, and zero-knowledge verification on the Midnight Network.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <MedProofDataProvider>
            <Header />
            <main style={{ paddingBottom: '60px', minHeight: 'calc(100vh - 160px)' }}>{children}</main>
            <footer
              style={{
                borderTop: '1px solid var(--border-subtle)',
                padding: '24px 24px 70px',
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'rgba(7, 10, 18, 0.95)',
              }}
            >
              MedProof Confidential Healthcare Credential &amp; Consent Exchange • Built with Midnight.js 4.1.1 &amp; Compact Zero-Knowledge Smart Contracts
            </footer>
            <SystemStatusBar />
          </MedProofDataProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
