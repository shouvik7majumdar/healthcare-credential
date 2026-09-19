import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  connectLaceWallet,
  fetchWalletAddressData,
  WalletLockedError,
  WalletExtensionChannelShutdownError,
  WalletConcurrentConnectError,
  WalletAuthorizationRejectedError,
  WalletNotDetectedError,
  resetLaceConnectionState,
  getConnectedLaceWalletApi,
} from '../ui/src/services/lace-wallet-service';

describe('MedProof Phase 8: Non-Fatal Post-Connect & Robust Wallet Data Readiness Tests', () => {
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    resetLaceConnectionState();
    vi.restoreAllMocks();
  });

  // 1. Successful Connection (Account #1 Reference State)
  it('Account #1 Reference: Successfully connects with genuine unshielded and shielded addresses', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1acc1unshieldedref12345'),
      getShieldedAddresses: vi.fn().mockResolvedValue({
        shieldedAddress: 'mn_shielded_preprod1acc1shieldedref67890',
        shieldedCoinPublicKey: '0xacc1coinpk',
        shieldedEncryptionPublicKey: '0xacc1encpk',
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

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');
    expect(state.walletDataStatus).toBe('READY');
    expect(state.address).toBe('mn_addr_preprod1acc1unshieldedref12345');
    expect(state.coinPublicKey).toBe('0xacc1coinpk');
    expect(state.encryptionPublicKey).toBe('0xacc1encpk');
    expect(state.networkId).toBe('preprod');
    expect(state.errorMessage).toBeNull();
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);
  });

  // 2. Non-Fatal Address Getter Timeout: Connection is PRESERVED
  it('Non-Fatal Getter Timeout: connect() succeeds even when getUnshieldedAddress times out', async () => {
    const slowWalletApi = {
      getUnshieldedAddress: vi.fn().mockImplementation(() => new Promise(() => {})), // Hangs
      getShieldedAddresses: vi.fn().mockImplementation(() => new Promise(() => {})), // Hangs
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(slowWalletApi),
        },
      },
    };

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');
    expect(state.walletDataStatus).toBe('LOADING');
    expect(state.address).toBeNull();
    expect(getConnectedLaceWalletApi()).toBe(slowWalletApi);
  });

  // 3. Post-Connect Locked State: Retains ConnectedAPI but flags walletDataStatus as LOCKED
  it('Post-Connect Lock Detection: Retains CONNECTED state and sets walletDataStatus to LOCKED', async () => {
    const lockedWalletApi = {
      getUnshieldedAddress: vi.fn().mockRejectedValue(new Error('Wallet is locked. Please unlock the wallet first.')),
      getShieldedAddresses: vi.fn().mockRejectedValue(new Error('Wallet is locked')),
    };

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockResolvedValue(lockedWalletApi),
        },
      },
    };

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');
    expect(state.walletDataStatus).toBe('LOCKED');
    expect(state.address).toBeNull();
    expect(state.errorMessage).toContain('Midnight Lace is locked');
    expect(getConnectedLaceWalletApi()).toBe(lockedWalletApi);
  });

  // 4. Bounded Address Readiness (fetchWalletAddressData retry)
  it('Bounded Readiness Retry: Successfully loads address on second attempt without reconnecting', async () => {
    let attempt = 0;
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockImplementation(async () => {
        attempt++;
        if (attempt === 1) {
          throw new Error('Wallet is warming up');
        }
        return 'mn_addr_preprod1loadedonattempt2';
      }),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    };

    const result = await fetchWalletAddressData(mockWalletApi, 3);
    expect(result.address).toBe('mn_addr_preprod1loadedonattempt2');
    expect(result.walletDataStatus).toBe('READY');
    expect(result.errorMessage).toBeNull();
  });

  // 5. Zero getConfiguration() at Connection Time
  it('Configuration Isolation: Does NOT invoke getConfiguration() or getDustAddress() during connect()', async () => {
    const getConfigurationSpy = vi.fn();
    const getDustAddressSpy = vi.fn();

    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1isolated'),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
      getConfiguration: getConfigurationSpy,
      getDustAddress: getDustAddressSpy,
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

    const state = await connectLaceWallet('preprod', 5000);
    expect(state.status).toBe('CONNECTED');
    expect(getConfigurationSpy).not.toHaveBeenCalled();
    expect(getDustAddressSpy).not.toHaveBeenCalled();
  });

  // 6. Wallet Locked Error During provider.connect()
  it('Locked Handshake: Throws WalletLockedError with unlock guidance if provider.connect() fails with locked', async () => {
    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockRejectedValue(new Error('Wallet is locked. Please unlock the wallet first.')),
        },
      },
    };

    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletLockedError);
  });

  // 7. Channel Shutdown During provider.connect()
  it('Channel Shutdown Handshake: Throws WalletExtensionChannelShutdownError on extension disconnect', async () => {
    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockRejectedValue(new Error("Remote API with channel 'feature-flags' was shutdown: object can no longer be used.")),
        },
      },
    };

    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletExtensionChannelShutdownError);
  });

  // 8. Provider Unavailable
  it('Provider Unavailable: Throws WalletNotDetectedError when window.midnight has no providers', async () => {
    (globalThis as any).window = {
      midnight: {},
    };

    await expect(connectLaceWallet('preprod', 500)).rejects.toThrow(WalletNotDetectedError);
  });

  // 9. Disconnect & Reconnect
  it('Disconnect and Reconnect: Cleans up active API and allows clean re-connection', async () => {
    const mockWalletApi = {
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_preprod1reconn_test'),
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

    // First connect
    const s1 = await connectLaceWallet('preprod', 5000);
    expect(s1.status).toBe('CONNECTED');
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);

    // Disconnect
    resetLaceConnectionState();
    expect(getConnectedLaceWalletApi()).toBeNull();

    // Reconnect
    const s2 = await connectLaceWallet('preprod', 5000);
    expect(s2.status).toBe('CONNECTED');
    expect(s2.address).toBe('mn_addr_preprod1reconn_test');
    expect(getConnectedLaceWalletApi()).toBe(mockWalletApi);
  });

  // 10. Duplicate Connect Protection
  it('Concurrency Guard: Blocks duplicate concurrent connect() calls while in flight', async () => {
    let resolveFn: any;
    const slowConnect = new Promise((resolve) => {
      resolveFn = resolve;
    });

    (globalThis as any).window = {
      midnight: {
        mnLace: {
          name: 'Midnight Lace',
          apiVersion: '4.0.1',
          connect: vi.fn().mockImplementation(() => slowConnect),
        },
      },
    };

    const first = connectLaceWallet('preprod', 5000);
    await expect(connectLaceWallet('preprod', 5000)).rejects.toThrow(WalletConcurrentConnectError);

    resolveFn({
      getUnshieldedAddress: vi.fn().mockResolvedValue('mn_addr_concurrent_ok'),
      getShieldedAddresses: vi.fn().mockResolvedValue(null),
    });
    const result = await first;
    expect(result.status).toBe('CONNECTED');
  });
});
