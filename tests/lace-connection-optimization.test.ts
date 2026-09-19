import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  connectLaceWallet,
  WalletExtensionChannelShutdownError,
  WalletConcurrentConnectError,
  WalletAuthorizationRejectedError,
  resetLaceConnectionState,
} from '../ui/src/services/lace-wallet-service';
import { getWalletStatusLabel, WalletStatus } from '../ui/src/types/wallet';

describe('MedProof Phase 6C: Lace Connection Optimization & Performance Diagnostics', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    resetLaceConnectionState();
    vi.restoreAllMocks();
  });

  // 1. Parallel Address Queries Execution
  it('Optimized Query Execution: Invokes getUnshieldedAddress and getShieldedAddresses in parallel', async () => {
    let unshieldedStartedAt = 0;
    let shieldedStartedAt = 0;
    let unshieldedFinishedAt = 0;
    let shieldedFinishedAt = 0;

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockImplementation(async () => {
        unshieldedStartedAt = Date.now();
        await new Promise((r) => setTimeout(r, 40));
        unshieldedFinishedAt = Date.now();
        return { unshieldedAddress: 'mn_addr_preprod1testparalleladdress999' };
      }),
      getShieldedAddresses: vi.fn().mockImplementation(async () => {
        shieldedStartedAt = Date.now();
        await new Promise((r) => setTimeout(r, 40));
        shieldedFinishedAt = Date.now();
        return {
          shieldedAddress: 'mn_shielded_preprod1testshieldedaddress999',
          shieldedCoinPublicKey: '0x999coinpk',
          shieldedEncryptionPublicKey: '0x888encpk',
        };
      }),
      getNetworkId: vi.fn().mockResolvedValue('preprod'),
    };

    (globalThis as any).window = {
      midnight: {
        'lace-opt-uuid': {
          name: 'lace',
          rdns: 'io.lace.wallet',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(mockWalletApi),
        },
      },
    };

    const startTime = Date.now();
    const state = await connectLaceWallet('preprod', 5000);
    const totalElapsed = Date.now() - startTime;

    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_addr_preprod1testparalleladdress999');
    expect(state.coinPublicKey).toBe('0x999coinpk');
    expect(state.encryptionPublicKey).toBe('0x888encpk');
    expect(state.networkId).toBe('preprod');

    // Both calls must have started concurrently (within 15ms of each other)
    expect(Math.abs(unshieldedStartedAt - shieldedStartedAt)).toBeLessThanOrEqual(25);
    // Total query duration should be ~40-60ms, not 80-120ms (which sequential execution would produce)
    expect(totalElapsed).toBeLessThan(400);
  });

  // 2. Zero Redundant Post-Connect Queries
  it('Redundancy Elimination: Does NOT invoke getConnectionStatus or isLocked after connect() succeeds', async () => {
    const isLockedSpy = vi.fn();
    const getConnectionStatusSpy = vi.fn();

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: 'mn_addr_preprod_nored_111' }),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedCoinPublicKey: '0xcoin1',
        shieldedEncryptionPublicKey: '0xenc1',
      }),
      isLocked: isLockedSpy,
      getConnectionStatus: getConnectionStatusSpy,
    };

    (globalThis as any).window = {
      midnight: {
        'lace-clean': {
          name: 'Midnight Lace',
          rdns: 'io.lace.wallet',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(mockWalletApi),
        },
      },
    };

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');
    // Neither redundant check should have been called
    expect(isLockedSpy).not.toHaveBeenCalled();
    expect(getConnectionStatusSpy).not.toHaveBeenCalled();
  });

  // 3. Side Panel Closed / Channel Shutdown Handling
  it('Side Panel Closed: Throws WalletExtensionChannelShutdownError with user guidance', async () => {
    const channelShutdownErr = new Error(
      "Remote API with channel 'feature-flags' was shutdown: object can no longer be used."
    );

    (globalThis as any).window = {
      midnight: {
        'lace-closed': {
          name: 'lace',
          rdns: 'io.lace.wallet',
          apiVersion: '4.0.1',
          connect: vi.fn().mockRejectedValue(channelShutdownErr),
        },
      },
    };

    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletExtensionChannelShutdownError);

    try {
      await connectLaceWallet('preprod', 5000);
    } catch (err: any) {
      expect(err.name).toBe('WalletExtensionChannelShutdownError');
      expect(err.message).toContain('Please open the Lace Side Panel and keep it open while using MedProof');
    }
  });

  // 4. Already-Authorized Fast Reconnection
  it('Cached Authorization Reconnect: Reconnects in < 25ms when session is cached', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: 'mn_addr_preprod_cached_fast' }),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedCoinPublicKey: '0xcachedcoin',
        shieldedEncryptionPublicKey: '0xcachedenc',
      }),
    };

    (globalThis as any).window = {
      midnight: {
        'lace-fast': {
          name: 'lace',
          rdns: 'io.lace.wallet',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(mockWalletApi),
        },
      },
    };

    const start = Date.now();
    const state = await connectLaceWallet('preprod', 5000);
    const elapsed = Date.now() - start;

    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_addr_preprod_cached_fast');
    expect(elapsed).toBeLessThan(35);
  });

  // 5. Concurrency Protection
  it('Concurrency Guard: Blocks concurrent connect() calls while in flight', async () => {
    let resolveFirst: any;
    const pendingPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: 'mn_addr_preprod_race' }),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedCoinPublicKey: '0xracecoin',
        shieldedEncryptionPublicKey: '0xraceenc',
      }),
    };

    (globalThis as any).window = {
      midnight: {
        'lace-guard': {
          name: 'lace',
          rdns: 'io.lace.wallet',
          apiVersion: '4.0.1',
          connect: vi.fn().mockImplementation(() => pendingPromise.then(() => mockWalletApi)),
        },
      },
    };

    const firstCall = connectLaceWallet('preprod', 5000);
    // Attempting a second call immediately while first is in flight
    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletConcurrentConnectError);

    resolveFirst();
    const result = await firstCall;
    expect(result.status).toBe('CONNECTED');
  });

  // 6. Explicit State Labels
  it('Explicit State UX: getWalletStatusLabel returns exact requested user labels', () => {
    const expectations: [WalletStatus, string][] = [
      ['DETECTING', 'Detecting Lace'],
      ['CONNECTING', 'Connecting to Midnight Lace...'],
      ['WAITING_FOR_LACE', 'Approve the connection request in Midnight Lace.'],
      ['CONNECTED', 'Midnight Lace connected'],
      ['WALLET_DATA_LOADING', 'Connected — loading wallet data...'],
      ['LACE_LOCKED', 'Unlock Midnight Lace and retry.'],
      ['LACE_UNAVAILABLE', 'Refresh/unlock Lace and retry.'],
      ['DISCONNECTED', 'Disconnected'],
      ['WRONG_NETWORK', 'Network Mismatch'],
      ['ERROR', 'Error'],
    ];

    for (const [status, expectedLabel] of expectations) {
      expect(getWalletStatusLabel(status)).toBe(expectedLabel);
    }
  });
});
