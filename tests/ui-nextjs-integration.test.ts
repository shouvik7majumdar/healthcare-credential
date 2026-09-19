import { describe, it, expect, vi, afterEach } from 'vitest';
import { existsSync } from 'fs';
import path from 'path';
import {
  detectAllMidnightProviders,
  selectLaceProvider,
  detectLaceProvider,
  connectLaceWallet,
  directProviderConnectTest,
  WalletNotDetectedError,
  WalletAuthorizationRejectedError,
  WalletEmptyAddressError,
  WalletConcurrentConnectError,
} from '../ui/src/services/lace-wallet-service';

describe('MedProof Phase 3: Next.js Structure and App Router Verification', () => {
  const uiSrcDir = path.resolve(__dirname, '../ui/src');

  it('verifies App Router root layout and landing page exist', () => {
    expect(existsSync(path.join(uiSrcDir, 'app/layout.tsx'))).toBe(true);
    expect(existsSync(path.join(uiSrcDir, 'app/page.tsx'))).toBe(true);
  });

  it('verifies all four required portal routes exist', () => {
    expect(existsSync(path.join(uiSrcDir, 'app/consent/page.tsx'))).toBe(true);
    expect(existsSync(path.join(uiSrcDir, 'app/verifier/page.tsx'))).toBe(true);
    expect(existsSync(path.join(uiSrcDir, 'app/credentials/page.tsx'))).toBe(true);
    expect(existsSync(path.join(uiSrcDir, 'app/privacy/page.tsx'))).toBe(true);
  });

  it('next.config.mjs exists in ui/', () => {
    expect(existsSync(path.resolve(__dirname, '../ui/next.config.mjs'))).toBe(true);
  });
});

// ============================================================
// PHASE 4F: MOCKED UNIT TESTS — REAL LACE connect() LIFECYCLE & DIAGNOSTICS
// Note: All tests in this block mock the browser globalThis.window provider for unit testing.
// These are explicitly MOCKED UNIT TESTS and NOT real Lace browser E2E tests.
// ============================================================

describe('MedProof Phase 4F: Lace connect() Promise Lifecycle (MOCKED UNIT TESTS)', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  // 1. Real Provider Selected
  it('Scenario 1: Real Provider Selected — Correctly discovers and selects Lace candidate by rdns and name', () => {
    const mockCandidate = {
      name: 'lace',
      rdns: 'io.lace.wallet',
      apiVersion: '4.0.1',
      connect: vi.fn(),
    };
    (globalThis as any).window = {
      midnight: {
        'b360ccb1-f42e-4461-b4c3-5abc6dd9c71a': mockCandidate,
      },
    };

    const providers = detectAllMidnightProviders();
    expect(providers.length).toBe(1);
    expect(providers[0].id).toBe('b360ccb1-f42e-4461-b4c3-5abc6dd9c71a');
    expect(providers[0].supportsConnect).toBe(true);

    const selected = selectLaceProvider(providers);
    expect(selected).not.toBeNull();
    expect(selected?.name).toBe('lace');
  });

  // 2. Correct Network Argument
  it('Scenario 2: Correct Network Argument — Invokes connect() with target network argument (e.g. preview)', async () => {
    const connectSpy = vi.fn().mockImplementation((netId) => {
      expect(netId).toBe('preview');
      return Promise.resolve({
        getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: 'mn_shielded_preview_test' }),
        getNetworkId: vi.fn().mockResolvedValue('preview'),
      });
    });

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: connectSpy,
        },
      },
    };

    const state = await connectLaceWallet('preview', 2000);
    expect(connectSpy).toHaveBeenCalledWith('preview');
    expect(state.networkId).toBe('preview');
  });

  // 3. Connect Call Starts
  it('Scenario 3: Connect Call Starts — Direct test executes connect without intermediate abstraction', async () => {
    const mockWalletApi = {
      getShieldedAddresses: vi.fn(),
      getUnshieldedAddress: vi.fn(),
      getDustAddress: vi.fn(),
      getConfiguration: vi.fn(),
    };
    const connectSpy = vi.fn().mockResolvedValue(mockWalletApi);

    (globalThis as any).window = {
      midnight: {
        'uuid-direct': {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: connectSpy,
        },
      },
    };

    const result = await directProviderConnectTest('preview');
    expect(result.success).toBe(true);
    expect(result.networkId).toBe('preview');
    expect(result.methods).toContain('getShieldedAddresses');
    expect(result.methods).toContain('getConfiguration');
    expect(result.errorMessage).toBeNull();
  });

  // 4. Connect Resolves
  it('Scenario 4: Connect Resolves — Connect resolves with genuine keys and updates state machine', async () => {
    const mockWalletApi = {
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedAddress: 'mn_shielded_valid_addr_123',
        shieldedCoinPublicKey: '0x123coin',
        shieldedEncryptionPublicKey: '0x456enc',
      }),
      getNetworkId: vi.fn().mockResolvedValue('preview'),
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

    const state = await connectLaceWallet('preview', 2000);
    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_shielded_valid_addr_123');
    expect(state.coinPublicKey).toBe('0x123coin');
    expect(state.encryptionPublicKey).toBe('0x456enc');
  });

  // 5. Connect Rejects
  it('Scenario 5: Connect Rejects — Throws WalletAuthorizationRejectedError on user denial', async () => {
    const mockConnect = vi.fn().mockRejectedValue({
      code: 'Rejected',
      message: 'Access to wallet api denied',
    });

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: mockConnect,
        },
      },
    };

    await expect(connectLaceWallet('preview', 2000)).rejects.toThrow(WalletAuthorizationRejectedError);
  });

  // 6. Connect Throws
  it('Scenario 6: Connect Throws — Surfaces typed error message when provider throws internal exception', async () => {
    const mockConnect = vi.fn().mockRejectedValue(new Error('Background service worker disconnected'));

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: mockConnect,
        },
      },
    };

    await expect(connectLaceWallet('preview', 2000)).rejects.toThrow(/Lace authorization failed: Background service worker disconnected/);
  });

  // 7. Connect Remains Pending
  it('Scenario 7: Connect Remains Pending — Times out cleanly without declaring fake success', async () => {
    const hangingConnect = vi.fn().mockImplementation(() => new Promise(() => {})); // Never resolves

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: hangingConnect,
        },
      },
    };

    await expect(connectLaceWallet('preview', 50)).rejects.toThrow(/timed out/i);
  });

  // 8. Already-Authorized Connection
  it('Scenario 8: Already-Authorized Connection — Connects instantly when Lace returns cached authorization', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue({
        unshieldedAddress: 'mn_unshielded_cached_auth_addr',
      }),
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

    const state = await connectLaceWallet('preview', 2000);
    expect(state.status).toBe('CONNECTED');
    expect(state.address).toBe('mn_unshielded_cached_auth_addr');
  });

  // 9. Duplicate Connect Prevention
  it('Scenario 9: Duplicate Connect Prevention — Blocks concurrent connect() calls while in flight', async () => {
    let resolveFirst: any;
    const slowConnect = vi.fn().mockImplementation(() => new Promise(r => { resolveFirst = r; }));

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: slowConnect,
        },
      },
    };

    const firstPromise = connectLaceWallet('preview', 5000);
    await expect(connectLaceWallet('preview', 5000)).rejects.toThrow(WalletConcurrentConnectError);

    resolveFirst({
      getUnshieldedAddress: vi.fn().mockResolvedValue({ unshieldedAddress: 'mn_addr_first' }),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    });
    await firstPromise;
  });

  // 10. Provider Disappears
  it('Scenario 10: Provider Disappears — Truthfully handles provider removal without retaining stale reference', () => {
    const mockProvider = {
      name: 'Lace',
      apiVersion: '4.0.1',
      connect: vi.fn(),
    };
    const winObj: any = {
      midnight: {
        mnLace: mockProvider,
      },
    };
    (globalThis as any).window = winObj;
    expect(detectAllMidnightProviders().length).toBe(1);

    delete winObj.midnight.mnLace;
    expect(detectAllMidnightProviders().length).toBe(0);
    expect(selectLaceProvider(detectAllMidnightProviders())).toBeNull();
  });
});
