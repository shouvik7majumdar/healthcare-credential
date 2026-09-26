// src/context/WalletContext.tsx
// Centralized React Context providing unified Lace provider discovery, diagnostics, and wallet state

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { WalletState, WalletStatus } from '../types/wallet';
import { INITIAL_WALLET_STATE } from '../types/wallet';
import {
  detectAllMidnightProviders,
  selectLaceProvider,
  connectLaceWallet,
  directProviderConnectTest,
  DiscoveredWallet,
  DirectTestResult,
  resetLaceConnectionState,
  getConnectedLaceWalletApi,
  fetchWalletAddressData,
  WalletExtensionChannelShutdownError,
  WalletLockedError,
  WalletAuthorizationRejectedError,
  WalletTimeoutError,
  WalletNotDetectedError,
} from '../services/lace-wallet-service';

export interface WalletDiagnostics {
  windowMidnightPresent: boolean;
  providerKeys: string[];
  lastScanTime: string;
  scanCount: number;
}

interface WalletContextType {
  wallet: WalletState;
  hasProvider: boolean;
  discoveredWallets: DiscoveredWallet[];
  selectedWallet: DiscoveredWallet | null;
  diagnostics: WalletDiagnostics;
  targetNetworkId: string;
  setTargetNetworkId: (net: string) => void;
  connect: (networkId?: string) => Promise<WalletState>;
  disconnect: () => void;
  cancelConnection: () => void;
  clearError: () => void;
  rescanProviders: () => void;
  runDirectTest: (networkId?: string) => Promise<DirectTestResult>;
  retryWalletData: () => Promise<void>;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [discoveredWallets, setDiscoveredWallets] = useState<DiscoveredWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<DiscoveredWallet | null>(null);
  const [targetNetworkId, setTargetNetworkId] = useState<string>('preprod');
  const [scanCount, setScanCount] = useState(0);
  const [lastScanTime, setLastScanTime] = useState<string>('Initializing scan...');
  const isConnectingRef = useRef(false);
  const currentAttemptIdRef = useRef(0);
  const hasAutoConnectedRef = useRef(false);

  const scan = useCallback(() => {
    const providers = detectAllMidnightProviders();
    const selected = selectLaceProvider(providers);

    setDiscoveredWallets(providers);
    setSelectedWallet(selected);
    setScanCount(c => c + 1);
    setLastScanTime(new Date().toLocaleTimeString());

    const available = Boolean(selected);

    setWallet(prev => {
      if (prev.status === 'CONNECTED' || prev.status === 'CONNECTING' || prev.status === 'WAITING_FOR_LACE') {
        return prev;
      }
      if (
        prev.status === 'ERROR' ||
        prev.status === 'REJECTED' ||
        prev.status === 'TIMEOUT' ||
        prev.status === 'LOCKED' ||
        prev.status === 'UNAVAILABLE' ||
        prev.status === 'WRONG_NETWORK'
      ) {
        return prev;
      }
      if (available && (prev.status === 'DISCONNECTED' || prev.status === 'DETECTING')) {
        return {
          ...prev,
          status: 'AVAILABLE',
          providerName: selected?.name || 'Midnight Lace',
          apiVersion: selected?.apiVersion || null,
        };
      }
      if (!available && prev.status === 'AVAILABLE') {
        return {
          ...prev,
          status: 'DISCONNECTED',
          providerName: null,
          apiVersion: null,
        };
      }
      return prev;
    });

    return providers;
  }, []);


  // Event-driven discovery with immediate scan, window events, and controlled interval that PAUSES when connected
  useEffect(() => {
    scan();

    // Do NOT run periodic polling when connected OR during active Lace authorization
    // Scanning during CONNECTING/WAITING_FOR_LACE causes state re-renders that can interrupt the auth flow
    if (
      wallet.status === 'CONNECTED' ||
      wallet.status === 'CONNECTING' ||
      wallet.status === 'WAITING_FOR_LACE'
    ) {
      return;
    }

    const interval = setInterval(scan, 3000);

    const onFocus = () => scan();
    window.addEventListener('focus', onFocus);
    window.addEventListener('load', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('load', onFocus);
    };
  }, [scan, wallet.status]);

  const cancelConnection = useCallback(() => {
    currentAttemptIdRef.current++;
    isConnectingRef.current = false;
    resetLaceConnectionState();
    setWallet(prev => ({
      ...INITIAL_WALLET_STATE,
      status: selectedWallet ? 'AVAILABLE' : 'DISCONNECTED',
      providerName: selectedWallet?.name || null,
      apiVersion: selectedWallet?.apiVersion || null,
      errorMessage: null,
    }));
  }, [selectedWallet]);

  const clearError = useCallback(() => {
    resetLaceConnectionState();
    setWallet(prev => {
      if (
        prev.status === 'ERROR' ||
        prev.status === 'REJECTED' ||
        prev.status === 'TIMEOUT' ||
        prev.status === 'LOCKED' ||
        prev.status === 'UNAVAILABLE' ||
        prev.status === 'WRONG_NETWORK'
      ) {
        return {
          ...prev,
          status: selectedWallet ? 'AVAILABLE' : 'DISCONNECTED',
          errorMessage: null,
        };
      }
      return prev;
    });
  }, [selectedWallet]);

  const connect = useCallback(async (netId?: string) => {
    if (isConnectingRef.current) {
      throw new Error('Wallet connection already in progress');
    }
    isConnectingRef.current = true;
    const networkToUse = netId || targetNetworkId;
    setWallet(prev => ({ ...prev, status: 'CONNECTING', errorMessage: null }));

    // If connection takes > 600ms, transition to WAITING_FOR_LACE (awaiting Lace popup / user approval)
    const waitingTimer = setTimeout(() => {
      if (isConnectingRef.current) {
        setWallet(prev => (prev.status === 'CONNECTING' ? { ...prev, status: 'WAITING_FOR_LACE' } : prev));
      }
    }, 600);

    try {
      const connectedState = await connectLaceWallet(networkToUse, 120000);
      clearTimeout(waitingTimer);
      try {
        localStorage.setItem('medproof_previously_connected', 'true');
      } catch {}
      setWallet(connectedState);

      if (!connectedState.address) {
        const activeApi = getConnectedLaceWalletApi();
        if (activeApi) {
          fetchWalletAddressData(activeApi, 3).then((res) => {
            if (res.address) {
              setWallet((prev) =>
                prev.status === 'CONNECTED'
                  ? {
                      ...prev,
                      address: res.address,
                      coinPublicKey: res.coinPublicKey || prev.coinPublicKey,
                      encryptionPublicKey: res.encryptionPublicKey || prev.encryptionPublicKey,
                      walletDataStatus: 'READY',
                      errorMessage: null,
                    }
                  : prev
              );
            } else if (res.walletDataStatus === 'LOCKED') {
              setWallet((prev) =>
                prev.status === 'CONNECTED'
                  ? {
                      ...prev,
                      walletDataStatus: 'LOCKED',
                      errorMessage: 'Midnight Lace is locked. Unlock Lace and click Retry Wallet Data.',
                    }
                  : prev
              );
            } else {
              setWallet((prev) =>
                prev.status === 'CONNECTED'
                  ? {
                      ...prev,
                      walletDataStatus: 'UNAVAILABLE',
                      errorMessage: 'Connected to Midnight Lace. Wallet data is temporarily unavailable. Unlock or refresh Lace, then retry.',
                    }
                  : prev
              );
            }
          }).catch(() => {});
        }
      }
      return connectedState;
    } catch (err: any) {
      clearTimeout(waitingTimer);
      resetLaceConnectionState();

      const isChannelShutdown =
        err instanceof WalletExtensionChannelShutdownError ||
        err?.isChannelShutdown === true ||
        err?.name === 'WalletExtensionChannelShutdownError' ||
        err?.message?.toLowerCase().includes('shutdown') ||
        err?.message?.toLowerCase().includes('feature-flags') ||
        err?.message?.toLowerCase().includes('side panel');
      const isRejection = err.name === 'WalletAuthorizationRejectedError';
      const isLocked =
        err instanceof WalletLockedError ||
        err?.name === 'WalletLockedError' ||
        err?.message?.toLowerCase().includes('wallet is locked') ||
        err?.message?.toLowerCase().includes('unlock the wallet') ||
        err?.message?.toLowerCase().includes('needs to be unlocked') ||
        (err?.message?.toLowerCase().includes('locked') && !err?.message?.toLowerCase().includes('block'));
      const isNetworkMismatch =
        err?.message?.toLowerCase().includes('network') &&
        (err?.message?.toLowerCase().includes('mismatch') || err?.message?.toLowerCase().includes('invalid'));

      let status: WalletStatus = 'ERROR';
      let errorMessage = err.message || 'Failed to connect to Midnight Lace Wallet';

      if (isChannelShutdown) {
        status = 'UNAVAILABLE';
        errorMessage = 'Midnight Lace is not available right now. Please open the Lace Side Panel and keep it open while using MedProof.';
      } else if (isLocked) {
        status = 'LOCKED';
        errorMessage = 'Midnight Lace needs to be unlocked or refreshed. Unlock Lace and retry the connection.';
      } else if (isRejection) {
        status = 'REJECTED';
      } else if (isNetworkMismatch) {
        status = 'WRONG_NETWORK';
      }

      const nextState: WalletState = {
        ...INITIAL_WALLET_STATE,
        status,
        providerName: selectedWallet?.name || 'Midnight Lace',
        apiVersion: selectedWallet?.apiVersion || '4.0.1',
        errorMessage,
      };
      setWallet(nextState);
      throw err;
    } finally {
      clearTimeout(waitingTimer);
      isConnectingRef.current = false;
    }
  }, [targetNetworkId, selectedWallet]);

  // Truthful Session-Aware Auto-Reconnect for previously connected sessions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let wasPreviouslyConnected = false;
    try {
      wasPreviouslyConnected = localStorage.getItem('medproof_previously_connected') === 'true';
    } catch {}

    if (wasPreviouslyConnected && !hasAutoConnectedRef.current && !isConnectingRef.current) {
      hasAutoConnectedRef.current = true;
      const timer = setTimeout(() => {
        const providers = detectAllMidnightProviders();
        const selected = selectLaceProvider(providers);
        if (selected) {
          connect('preprod').catch((err: any) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[MEDPROOF-LACE] Auto-reconnect notice:', err?.message || String(err));
            }
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [connect]);


  const runDirectTest = useCallback(async (netId?: string) => {
    const networkToUse = netId || targetNetworkId;
    return await directProviderConnectTest(networkToUse);
  }, [targetNetworkId]);

  const retryWalletData = useCallback(async () => {
    const api = getConnectedLaceWalletApi();
    if (!api) {
      if (selectedWallet) {
        await connect();
      }
      return;
    }
    setWallet((prev) => ({ ...prev, walletDataStatus: 'LOADING', errorMessage: null }));
    const result = await fetchWalletAddressData(api, 3);
    setWallet((prev) => ({
      ...prev,
      address: result.address || prev.address,
      coinPublicKey: result.coinPublicKey || prev.coinPublicKey,
      encryptionPublicKey: result.encryptionPublicKey || prev.encryptionPublicKey,
      walletDataStatus: result.walletDataStatus,
      errorMessage: result.address ? null : result.errorMessage,
    }));
  }, [selectedWallet, connect]);

  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    try {
      localStorage.removeItem('medproof_previously_connected');
    } catch {}
    resetLaceConnectionState();
    setWallet({
      ...INITIAL_WALLET_STATE,
      status: selectedWallet ? 'AVAILABLE' : 'DISCONNECTED',
      providerName: selectedWallet?.name || null,
      apiVersion: selectedWallet?.apiVersion || null,
    });
  }, [selectedWallet]);

  const diagnostics: WalletDiagnostics = useMemo(() => {
    const win = typeof window !== 'undefined' ? (window as any) : undefined;
    const windowMidnightPresent = Boolean(win && win.midnight);
    const providerKeys = win && win.midnight ? Object.keys(win.midnight) : [];
    return {
      windowMidnightPresent,
      providerKeys,
      lastScanTime,
      scanCount,
    };
  }, [lastScanTime, scanCount]);

  const value = useMemo(
    () => ({
      wallet,
      hasProvider: Boolean(selectedWallet),
      discoveredWallets,
      selectedWallet,
      diagnostics,
      targetNetworkId,
      setTargetNetworkId: (net: string) => {
        setTargetNetworkId(net);
        clearError();
      },
      connect,
      disconnect,
      cancelConnection,
      clearError,
      retryWalletData,
      rescanProviders: scan,
      runDirectTest,
      isConnected: wallet.status === 'CONNECTED',
    }),
    [wallet, selectedWallet, discoveredWallets, diagnostics, targetNetworkId, connect, disconnect,
      cancelConnection, clearError, retryWalletData, scan, runDirectTest]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a <WalletProvider>');
  }
  return ctx;
}
