// src/hooks/useLaceWallet.ts
// React hook bridging components to the centralized WalletContext
// Maintains 100% backward compatibility for all existing callers

'use client';

export { useWallet as useLaceWallet } from '../context/WalletContext';
export { useWallet } from '../context/WalletContext';
