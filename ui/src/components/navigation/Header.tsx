// ui/src/components/navigation/Header.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '../../context/WalletContext';
import { WalletModal } from '../wallet/WalletModal';

export function Header() {
  const pathname = usePathname();
  const {
    wallet,
    connect,
    disconnect,
    retryWalletData,
    cancelConnection,
    hasProvider,
    selectedWallet,
  } = useWallet();

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/patient', label: 'Patient Vault' },
    { href: '/provider', label: 'Provider Portal' },
    { href: '/consent', label: 'Consent Center' },
    { href: '/verifier', label: 'Verifier' },
    { href: '/credentials', label: 'Credentials' },
    { href: '/privacy', label: 'Privacy Architecture' },
  ];

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    if (addr.length <= 16) return addr;
    return addr.substring(0, 8) + '...' + addr.substring(addr.length - 8);
  };

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wallet.address && navigator.clipboard) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectClick = async () => {
    if (
      wallet.status === 'WAITING_FOR_LACE' ||
      wallet.status === 'LOCKED' ||
      wallet.status === 'ERROR' ||
      wallet.status === 'REJECTED'
    ) {
      cancelConnection();
      try {
        await connect('preprod');
      } catch {
        setIsWalletModalOpen(true);
      }
      return;
    }
    if (wallet.status === 'UNAVAILABLE') {
      setIsWalletModalOpen(true);
      return;
    }
    if (hasProvider || selectedWallet) {
      try {
        await connect('preprod');
      } catch {
        setIsWalletModalOpen(true);
      }
    } else {
      setIsWalletModalOpen(true);
    }
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(6, 11, 24, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
          gap: '12px',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: '#ffffff',
              fontSize: '18px',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.35)',
            }}
          >
            M
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--text-primary)',
                letterSpacing: '0.6px',
                lineHeight: 1.1,
              }}
            >
              MED<span className="gradient-text">PROOF</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Confidential Exchange
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '7px 11px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(37, 99, 235, 0.14)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(59, 130, 246, 0.32)'
                    : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {wallet.status === 'CONNECTED' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald" title="Connected to Midnight Preprod">
                ● {wallet.networkName || 'Preprod'}
              </span>

              {wallet.address ? (
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-card)',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    className="mono"
                    style={{ color: 'var(--text-primary)', fontSize: '12px' }}
                    title={wallet.address}
                  >
                    {formatAddress(wallet.address)}
                  </span>
                  <button
                    onClick={copyAddress}
                    title="Copy full unshielded address"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copied ? '#34d399' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                  <button
                    onClick={disconnect}
                    title="Disconnect Lace Wallet"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '2px 4px',
                      marginLeft: '2px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                  }}
                >
                  {wallet.walletDataStatus === 'LOCKED' ? (
                    <button
                      onClick={retryWalletData}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      🔒 Unlock Lace &amp; Retry
                    </button>
                  ) : wallet.walletDataStatus === 'LOADING' ? (
                    <span style={{ color: 'var(--text-muted)' }}>⏳ Loading address...</span>
                  ) : (
                    <button
                      onClick={retryWalletData}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      🔄 Fetch Address
                    </button>
                  )}
                  <button
                    onClick={disconnect}
                    title="Disconnect Lace Wallet"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      marginLeft: '4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleConnectClick}
              style={{
                fontSize: '12px',
                padding: '7px 14px',
                background:
                  wallet.status === 'UNAVAILABLE'
                    ? 'rgba(239, 68, 68, 0.16)'
                    : undefined,
                border:
                  wallet.status === 'UNAVAILABLE'
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : undefined,
                color: wallet.status === 'UNAVAILABLE' ? '#fca5a5' : undefined,
              }}
            >
              {wallet.status === 'CONNECTING'
                ? '⏳ Connecting...'
                : wallet.status === 'WAITING_FOR_LACE'
                ? '🔔 Approve in Midnight Lace'
                : wallet.status === 'LOCKED'
                ? '🔒 Lace Locked — Retry'
                : wallet.status === 'UNAVAILABLE'
                ? '⚠️ Lace Unavailable'
                : 'Connect Lace'}
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '12px 0 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(37, 99, 235, 0.14)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(59, 130, 246, 0.3)'
                    : '1px solid transparent',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
}
