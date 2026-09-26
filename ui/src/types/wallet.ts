// src/types/wallet.ts
// Strict explicit wallet state machine for authentic Midnight Lace integration

export type WalletStatus =
  | 'DISCONNECTED'
  | 'DETECTING'
  | 'AVAILABLE'
  | 'CONNECTING'
  | 'WAITING_FOR_LACE'
  | 'CONNECTED'
  | 'WALLET_DATA_LOADING'
  | 'WALLET_DATA_READY'
  | 'LACE_LOCKED'
  | 'LACE_UNAVAILABLE'
  | 'UNAVAILABLE'
  | 'REJECTED'
  | 'TIMEOUT'
  | 'ERROR'
  | 'LOCKED'
  | 'WRONG_NETWORK';

export type WalletDataStatus = 'NOT_REQUESTED' | 'LOADING' | 'READY' | 'UNAVAILABLE' | 'LOCKED';

export interface WalletState {
  status: WalletStatus;
  walletDataStatus?: WalletDataStatus;
  address: string | null;
  coinPublicKey: string | null;
  encryptionPublicKey: string | null;
  networkId: string | null;
  networkName: string | null;
  errorMessage: string | null;
  providerName: string | null;
  apiVersion: string | null;
}

export const INITIAL_WALLET_STATE: WalletState = {
  status: 'DISCONNECTED',
  walletDataStatus: 'NOT_REQUESTED',
  address: null,
  coinPublicKey: null,
  encryptionPublicKey: null,
  networkId: null,
  networkName: null,
  errorMessage: null,
  providerName: null,
  apiVersion: null,
};

export function getWalletStatusLabel(status: WalletStatus): string {
  switch (status) {
    case 'DETECTING':
      return 'Detecting Lace';
    case 'CONNECTING':
      return 'Connecting to Midnight Lace...';
    case 'WAITING_FOR_LACE':
      return 'Approve the connection request in Midnight Lace.';
    case 'CONNECTED':
      return 'Midnight Lace connected';
    case 'WALLET_DATA_LOADING':
      return 'Connected — loading wallet data...';
    case 'WALLET_DATA_READY':
      return 'Connected';
    case 'TIMEOUT':
      return 'Lace connection timed out. Click Retry.';
    case 'LACE_LOCKED':
    case 'LOCKED':
      return 'Unlock Midnight Lace and retry.';
    case 'LACE_UNAVAILABLE':
    case 'UNAVAILABLE':
      return 'Refresh/unlock Lace and retry.';
    case 'DISCONNECTED':
      return 'Disconnected';
    case 'WRONG_NETWORK':
      return 'Network Mismatch';
    case 'REJECTED':
      return 'Rejected';
    case 'AVAILABLE':
      return 'Lace Detected';
    case 'ERROR':
    default:
      return 'Error';
  }
}
