'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLaceWallet } from '../../hooks/useLaceWallet';
import { WalletModal } from '../wallet/WalletModal';

export function Header() {
  const pathname = usePathname();
  const { wallet, hasProvider, selectedWallet, connect, disconnect, cancelConnection, retryWalletData } = useLaceWallet();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/provider', label: 'Provider Portal' },
    { href: '/patient', label: 'Patient Vault' },
    { href: '/consent', label: 'Consent Center' },
    { href: '/verifier', label: 'Verifier Portal' },
    { href: '/credentials', label: 'Credentials' },
    { href: '/privacy', label: 'Privacy Architecture' },
  ];

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    if (addr.length <= 16) return addr;
    return addr.substring(0, 8) + '...' + addr.substring(addr.length - 8);
  };

  const handleConnectClick = async () => {
    if (wallet.status === 'WAITING_FOR_LACE' || wallet.status === 'LOCKED' || wallet.status === 'ERROR' || wallet.status === 'REJECTED') {
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
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 10, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '68px',
      }}>
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-indigo))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#070a12',
            fontSize: '18px'
          }}>
            M
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
              MED<span className="gradient-text">PROOF</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confidential Exchange
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 242, 254, 0.2)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet Badge / Connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {wallet.status === 'CONNECTED' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald">
                ● {wallet.networkName || 'Midnight'}
              </span>
              {wallet.address ? (
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="mono" style={{ color: 'var(--text-primary)' }}>
                    {formatAddress(wallet.address)}
                  </span>
                  <button
                    onClick={disconnect}
                    title="Disconnect Lace Wallet"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginLeft: '4px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px'
                }}>
                  {wallet.walletDataStatus === 'LOCKED' ? (
                    <button
                      onClick={retryWalletData}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fbbf24',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0
                      }}
                    >
                      🔒 Unlock Lace &amp; Retry
                    </button>
                  ) : wallet.walletDataStatus === 'LOADING' ? (
                    <span style={{ color: 'var(--text-muted)' }}>
                      ⏳ Loading address...
                    </span>
                  ) : (
                    <button
                      onClick={retryWalletData}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-teal)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: 0
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
                      fontSize: '14px',
                      marginLeft: '6px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConnectClick}
              disabled={false}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                background: wallet.status === 'UNAVAILABLE' ? 'rgba(239, 68, 68, 0.15)' : undefined,
                border: wallet.status === 'UNAVAILABLE' ? '1px solid rgba(239, 68, 68, 0.4)' : undefined,
                color: wallet.status === 'UNAVAILABLE' ? '#fca5a5' : undefined,
              }}
            >
              {wallet.status === 'CONNECTING'
                ? '⏳ Connecting...'
                : wallet.status === 'WAITING_FOR_LACE'
                ? '🔔 Approve in Midnight Lace'
                : wallet.status === 'LOCKED'
                ? '🔒 Lace Locked - Retry'
                : wallet.status === 'UNAVAILABLE'
                ? '⚠️ Lace Unavailable'
                : 'Connect Lace Wallet'}
            </button>
          )}
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </header>
  );
}
