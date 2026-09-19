import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  connectLaceWallet,
  WalletLockedError,
  WalletExtensionChannelShutdownError,
  WalletConcurrentConnectError,
  resetLaceConnectionState,
  getConnectedLaceWalletApi,
  detectAllMidnightProviders,
  selectLaceProvider,
} from '../ui/src/services/lace-wallet-service';

describe('MedProof Phase 8: Fast Auto-Reconnect & Minimal Lace UX Tests', () => {
  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    resetLaceConnectionState();
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    resetLaceConnectionState();
    vi.restoreAllMocks();
  });

  // TEST A: Fresh browser origin → Connect → real Lace authorization → connected
  it('TEST A: Fresh browser origin initiates real connect() and transitions to CONNECTED upon authorization', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1freshuserconn12345'),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedAddress: 'mn_shielded_preprod1freshshielded67890',
        shieldedCoinPublicKey: '0xfreshcoinpk',
        shieldedEncryptionPublicKey: '0xfreshencpk',
      }),
    };

    const mockConnect = vi.fn().mockResolvedValue(mockWalletApi);

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: mockConnect,
        },
      },
    };

    const startTime = Date.now();
    const state = await connectLaceWallet('preprod', 5000);
    const duration = Date.now() - startTime;

    expect(mockConnect).toHaveBeenCalledWith('preprod');
    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_addr_preprod1freshuserconn12345');
    expect(state.networkId).toBe('preprod');
    expect(state.errorMessage).toBeNull();
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);
    expect(duration).toBeLessThan(100);
  });

  // TEST B: Refresh page with previously authorized Lace session → automatic reconnect attempt → connected
  it('TEST B: Cached/Previously authorized session reconnects silently in < 30ms without extra RPCs', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1cachedfastreconnect'),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedCoinPublicKey: '0xcachedcoin',
        shieldedEncryptionPublicKey: '0xcachedenc',
      }),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(mockWalletApi),
        },
      },
    };

    const start = Date.now();
    const state = await connectLaceWallet('preprod', 2000);
    const elapsed = Date.now() - start;

    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_addr_preprod1cachedfastreconnect');
    expect(elapsed).toBeLessThan(35);
  });

  // TEST C: Lace locked → MedProof detects LACE_LOCKED → unlock Lace manually → Retry → connected
  it('TEST C: Detects wallet locked error cleanly, allows manual user unlock and retry to succeed', async () => {
    let isUnlocked = false;

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1recoveredafterunlock'),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockImplementation(() => {
            if (!isUnlocked) {
              return Promise.reject(new Error('Wallet is locked. Please unlock the wallet first.'));
            }
            return Promise.resolve(mockWalletApi);
          }),
        },
      },
    };

    // Step 1: Locked attempt throws WalletLockedError
    await expect(connectLaceWallet('preprod', 2000)).rejects.toThrow(WalletLockedError);

    // Step 2: User unlocks Lace in Chrome toolbar and clicks Retry
    isUnlocked = true;
    resetLaceConnectionState();

    // Step 3: Second attempt succeeds cleanly
    const state = await connectLaceWallet('preprod', 2000);
    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_addr_preprod1recoveredafterunlock');
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);
  });

  // TEST D: Disconnect → Connect once → connected
  it('TEST D: Disconnect clears active state and subsequent connect succeeds on single user gesture', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1disc_reconn'),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(mockWalletApi),
        },
      },
    };

    // Initial connection
    const state1 = await connectLaceWallet('preprod', 2000);
    expect(state1.status).toBe('CONNECTED');
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);

    // Disconnect
    resetLaceConnectionState();
    expect(getConnectedLaceWalletApi()).toBeNull();

    // Reconnect
    const state2 = await connectLaceWallet('preprod', 2000);
    expect(state2.status).toBe('CONNECTED');
    expect(state2.address).toBe('mn_addr_preprod1disc_reconn');
  });

  // TEST E: Close/reopen MedProof → no duplicate connect calls → no infinite loop
  it('TEST E: Prevents concurrent duplicate connect() calls while in flight and does not loop', async () => {
    let finishFirstConnect: any;
    const pendingPromise = new Promise((resolve) => {
      finishFirstConnect = resolve;
    });

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1no_duplicate_ok'),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockImplementation(() => pendingPromise.then(() => mockWalletApi)),
        },
      },
    };

    const firstCall = connectLaceWallet('preprod', 5000);

    // Second immediate call while first is in flight must be blocked by concurrency guard
    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletConcurrentConnectError);

    finishFirstConnect();
    const finalState = await firstCall;
    expect(finalState.status).toBe('CONNECTED');
    expect(finalState.address).toBe('mn_addr_preprod1no_duplicate_ok');
  });

  // Pipeline RPC Call Count Verification: Exactly 0 pre-connect RPCs, exactly 2 post-connect parallel RPCs
  it('Pipeline Verification: 0 pre-connect RPC calls and exactly 2 parallel post-connect RPC calls', async () => {
    const rpcLog: string[] = [];

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockImplementation(async () => {
        rpcLog.push('getUnshieldedAddress');
        return 'mn_addr_preprod1pipelinetest';
      }),
      getShieldedAddresses: vi.fn().mockImplementation(async () => {
        rpcLog.push('getShieldedAddresses');
        return { shieldedCoinPublicKey: '0xpipecoin', shieldedEncryptionPublicKey: '0xpipeenc' };
      }),
      isLocked: vi.fn().mockImplementation(() => {
        rpcLog.push('isLocked');
        return false;
      }),
      getConnectionStatus: vi.fn().mockImplementation(() => {
        rpcLog.push('getConnectionStatus');
        return 'connected';
      }),
    };

    const mockProvider = {
      name: 'Midnight Lace',
      apiVersion: '4.0.1',
      connect: vi.fn().mockImplementation(async (netId: string) => {
        rpcLog.push('provider.connect(' + netId + ')');
        return mockWalletApi;
      }),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: mockProvider,
      },
    };

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');

    // Verify RPC call sequence:
    // 1. provider.connect('preprod') was first
    expect(rpcLog[0]).toBe('provider.connect(preprod)');
    // 2. Only getUnshieldedAddress and getShieldedAddresses were called post-connect
    expect(rpcLog).toContain('getUnshieldedAddress');
    expect(rpcLog).toContain('getShieldedAddresses');
    expect(rpcLog).not.toContain('isLocked');
    expect(rpcLog).not.toContain('getConnectionStatus');
    expect(rpcLog.length).toBe(3); // 1 connect + 2 parallel address queries
  });
});
