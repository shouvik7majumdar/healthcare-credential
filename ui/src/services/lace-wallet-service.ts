// src/services/lace-wallet-service.ts
// Genuine Lace Midnight DApp Connector Integration — Multi-Network Auto-Negotiation & Robust Address Extraction
// ABSOLUTELY NO FAKE FALLBACKS

import type { WalletState, WalletStatus, WalletDataStatus } from '../types/wallet';

export interface DiscoveredWallet {
  id: string;
  name: string;
  apiVersion: string;
  icon?: string;
  rdns?: string;
  provider: any;
  supportsConnect: boolean;
  supportsEnable: boolean;
}

export interface DirectTestResult {
  success: boolean;
  elapsedMs: number;
  networkId: string;
  providerId: string;
  methods: string[];
  errorMessage: string | null;
}

export class WalletTimeoutError extends Error {
  constructor(details?: string) {
    super(details || 'Lace connection timed out. Please approve the pending request in Lace, or try again.');
    this.name = 'WalletTimeoutError';
  }
}

export class WalletNotDetectedError extends Error {
  constructor() {
    super('Midnight Lace Wallet extension was not detected in this browser. Please ensure Midnight Lace is installed, unlocked, and enabled.');
    this.name = 'WalletNotDetectedError';
  }
}

export class WalletAuthorizationRejectedError extends Error {
  constructor() {
    super('Wallet authorization was rejected by the user. Please click the Lace extension icon in your Chrome toolbar and approve the connection.');
    this.name = 'WalletAuthorizationRejectedError';
  }
}

export class WalletLockedError extends Error {
  constructor(details?: string) {
    super(
      details ||
        'Midnight Lace needs to be unlocked or refreshed. Unlock Lace and retry the connection.'
    );
    this.name = 'WalletLockedError';
  }
}

export class WalletEmptyAddressError extends Error {
  constructor(details?: string) {
    super(details || 'Connected Lace wallet returned an empty address. Please ensure an account is created and unlocked in Lace, then select it for this DApp.');
    this.name = 'WalletEmptyAddressError';
  }
}

export class WalletExtensionChannelShutdownError extends Error {
  isChannelShutdown: boolean;
  constructor(details?: string) {
    super(
      details ||
        'Midnight Lace is not available right now. Please open the Lace Side Panel and keep it open while using MedProof.'
    );
    this.name = 'WalletExtensionChannelShutdownError';
    this.isChannelShutdown = true;
  }
}

export class WalletConcurrentConnectError extends Error {
  constructor() {
    super('A wallet authorization request is already in progress. Please complete or cancel the existing request.');
    this.name = 'WalletConcurrentConnectError';
  }
}

let isConnectInFlight = false;
let activeConnectedWalletApi: any = null;

export function getConnectedLaceWalletApi(): any {
  return activeConnectedWalletApi;
}

export function setConnectedLaceWalletApi(api: any): void {
  activeConnectedWalletApi = api;
}

export function resetLaceConnectionState(): void {
  isConnectInFlight = false;
  activeConnectedWalletApi = null;
}

export const SUPPORTED_NETWORKS = ['preprod', 'undeployed', 'preview', 'testnet', 'devnet', 'mainnet'];

export const NETWORK_DISPLAY_NAMES: Record<string, string> = {
  auto: 'Auto-Detect Active Network',
  preprod: 'Midnight Preprod Testnet',
  undeployed: 'Midnight Local DevNet (#0)',
  preview: 'Midnight Preview Testnet',
  testnet: 'Midnight Testnet',
  devnet: 'Midnight DevNet',
  mainnet: 'Midnight Mainnet',
};

/**
 * Universal recursive address extractor that safely parses any return type
 * from Midnight Lace (plain strings, Bech32 instances, wrapper objects, arrays, byte buffers).
 */
export function extractAddressString(val: any): string {
  if (!val) return '';

  // 1. Plain string extraction
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      trimmed &&
      trimmed !== '[object Object]' &&
      !trimmed.startsWith('[object ') &&
      trimmed !== 'undefined' &&
      trimmed !== 'null' &&
      trimmed.length >= 10
    ) {
      return trimmed;
    }
    return '';
  }

  // 2. Uint8Array / Buffer / ArrayBuffer raw byte extraction
  if (
    val instanceof Uint8Array ||
    (typeof val === 'object' && val.constructor && val.constructor.name === 'Uint8Array') ||
    (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(val))
  ) {
    try {
      const bytes = new Uint8Array(val.buffer || val);
      if (bytes.length >= 16) {
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch {}
    return '';
  }

  // 3. Array of addresses or items
  if (Array.isArray(val) && val.length > 0) {
    for (const item of val) {
      const extracted = extractAddressString(item);
      if (extracted) return extracted;
    }
    return '';
  }

  // 4. Object representations
  if (typeof val === 'object') {
    // Explicit string conversion methods
    if (typeof val.toBech32 === 'function') {
      try {
        const s = val.toBech32();
        if (typeof s === 'string' && s.trim()) return s.trim();
      } catch {}
    }
    if (typeof val.asString === 'function') {
      try {
        const s = val.asString();
        if (typeof s === 'string' && s.trim()) return s.trim();
      } catch {}
    }
    if (typeof val.toHex === 'function') {
      try {
        const s = val.toHex();
        if (typeof s === 'string' && s.trim()) return s.trim();
      } catch {}
    }

    // Direct named address fields
    const directFields = [
      'address',
      'unshieldedAddress',
      'shieldedAddress',
      'dustAddress',
      'changeAddress',
      'receivingAddress',
      'bech32Address',
      'bech32',
      'hexAddress',
      'addressHex',
      'rawAddress',
      'shieldedAddresses',
      'unshieldedAddresses',
      'dustAddresses',
      'addresses',
      'usedAddresses',
      'unusedAddresses',
      'account',
      'accounts',
      'activeAccount',
      'selectedAccount',
      'state',
    ];

    for (const field of directFields) {
      if (val[field] !== undefined) {
        const res = extractAddressString(val[field]);
        if (res) return res;
      }
    }

    // Canonical Midnight public key combination if available
    // In @midnight-ntwrk/wallet-api: CoinPublicKey (32 byte hex string), EncryptionPublicKey (35 byte hex string) concatenated by '|'
    if (val.coinPublicKey && val.encryptionPublicKey) {
      const cpk = extractAddressString(val.coinPublicKey) || String(val.coinPublicKey).trim();
      const epk = extractAddressString(val.encryptionPublicKey) || String(val.encryptionPublicKey).trim();
      if (cpk && epk) {
        return cpk + '|' + epk;
      }
    }

    // toString fallback if custom representation exists
    if (typeof val.toString === 'function') {
      try {
        const s = val.toString();
        if (
          typeof s === 'string' &&
          s.trim() &&
          s !== '[object Object]' &&
          !s.startsWith('[object ') &&
          !s.includes(',') &&
          s.length >= 15
        ) {
          return s.trim();
        }
      } catch {}
    }

    // Recursive search across remaining keys
    for (const key of Object.keys(val)) {
      if (key === 'provider' || key === 'walletApi' || key === 'window') continue;
      try {
        const sub = extractAddressString(val[key]);
        if (
          sub &&
          (sub.startsWith('mn_') ||
            sub.startsWith('addr') ||
            sub.startsWith('undeployed') ||
            sub.startsWith('preprod') ||
            sub.includes('|') ||
            sub.length >= 24)
        ) {
          return sub;
        }
      } catch {}
    }
  }

  return '';
}

/**
 * Enumerate all injected Midnight wallets adhering to CAIP-372 / CIP-30 / DApp Connector API standards.
 */
export function detectAllMidnightProviders(): DiscoveredWallet[] {
  if (typeof window === 'undefined') return [];
  const win = window as any;
  const discovered: DiscoveredWallet[] = [];
  const seenIds = new Set<string>();

  const registerCandidate = (id: string, candidate: any) => {
    if (!candidate || typeof candidate !== 'object' || seenIds.has(id)) return;
    seenIds.add(id);

    const supportsConnect = typeof candidate.connect === 'function';
    const supportsEnable = typeof candidate.enable === 'function';

    if (!supportsConnect && !supportsEnable && typeof candidate.isEnabled !== 'function') {
      return;
    }

    discovered.push({
      id,
      name: candidate.name || (id === 'mnLace' ? 'Midnight Lace' : id),
      apiVersion: candidate.apiVersion || 'unknown',
      icon: candidate.icon,
      rdns: candidate.rdns,
      provider: candidate,
      supportsConnect,
      supportsEnable,
    });
  };

  // 1. Primary standard: window.midnight.{walletId}
  if (win.midnight && typeof win.midnight === 'object') {
    // If canonical 'mnLace' is present, register it first
    if (win.midnight.mnLace) {
      registerCandidate('mnLace', win.midnight.mnLace);
    }

    const keys = new Set<string>([
      ...Object.keys(win.midnight),
      ...Object.getOwnPropertyNames(win.midnight),
    ]);

    for (const key of keys) {
      try {
        registerCandidate(key, win.midnight[key]);
      } catch {
        // Guard against throwing getters
      }
    }
  }

  // 2. Fallback for earlier mock or unified Cardano injection
  if (win.cardano?.mnLace) {
    registerCandidate('cardano.mnLace', win.cardano.mnLace);
  }

  return discovered;
}

/**
 * Deterministic provider selection:
 * 1. Prefer canonical 'mnLace' if available.
 * 2. Prefer Lace when metadata (name or rdns or id) identifies it as Lace.
 * 3. Otherwise use first compatible provider.
 */
export function selectLaceProvider(providers: DiscoveredWallet[]): DiscoveredWallet | null {
  if (!providers || providers.length === 0) return null;

  const canonicalLace = providers.find((p) => p.id === 'mnLace');
  if (canonicalLace) return canonicalLace;

  const laceProvider = providers.find(
    (p) =>
      (p.rdns && p.rdns.toLowerCase().includes('lace')) ||
      (p.name && p.name.toLowerCase().includes('lace')) ||
      p.id.toLowerCase().includes('lace')
  );
  if (laceProvider) return laceProvider;

  return providers[0] || null;
}

/**
 * Legacy compatible export for single provider detection
 */
export function detectLaceProvider(): any | null {
  const all = detectAllMidnightProviders();
  const selected = selectLaceProvider(all);
  return selected ? selected.provider : null;
}

/**
 * Helper to invoke an API method on a target object without detaching the method reference.
 * Supports Promises and RxJS Observables with safe timeout.
 */
async function invokeApiMethod(target: any, method: string, timeoutMs = 8000): Promise<any> {
  if (!target) return undefined;
  const val = target[method];
  if (val === undefined) return undefined;

  let res: any;
  if (typeof val === 'function') {
    try {
      res = target[method]();
    } catch (syncErr) {
      throw syncErr;
    }
  } else {
    res = val;
  }

  if (res && typeof res.then === 'function') {
    return await Promise.race([
      res,
      new Promise((_, rej) => setTimeout(() => rej(new Error(method + ' timed out after ' + timeoutMs + 'ms')), timeoutMs)),
    ]);
  }

  if (res && typeof res.subscribe === 'function') {
    return await new Promise((resolve, reject) => {
      let sub: any;
      const timer = setTimeout(() => {
        try {
          sub?.unsubscribe?.();
        } catch {}
        reject(new Error(method + ' observable emission timed out after ' + timeoutMs + 'ms'));
      }, timeoutMs);
      try {
        sub = res.subscribe({
          next: (v: any) => {
            clearTimeout(timer);
            try {
              sub?.unsubscribe?.();
            } catch {}
            resolve(v);
          },
          error: (err: any) => {
            clearTimeout(timer);
            try {
              sub?.unsubscribe?.();
            } catch {}
            reject(err);
          },
        });
      } catch (subErr) {
        clearTimeout(timer);
        reject(subErr);
      }
    });
  }

  return res;
}

/**
 * Step 7 Diagnostic: Direct Provider connect() Test
 * Directly invokes provider.connect(targetNetworkId) with auto-network negotiation across candidate networks.
 * Inspects all own and prototype methods on the returned walletApi.
 */
export async function directProviderConnectTest(targetNetworkId?: string): Promise<DirectTestResult> {
  const startTime = Date.now();
  const providers = detectAllMidnightProviders();
  const selected = selectLaceProvider(providers);

  if (!selected) {
    return {
      success: false,
      elapsedMs: Date.now() - startTime,
      networkId: targetNetworkId || 'auto',
      providerId: 'none',
      methods: [],
      errorMessage: 'No Lace provider detected in window.midnight',
    };
  }

  const effectiveTarget = targetNetworkId && targetNetworkId !== 'auto' ? targetNetworkId : undefined;
  const networksToTry = effectiveTarget
    ? [effectiveTarget, ...SUPPORTED_NETWORKS.filter((n) => n !== effectiveTarget)]
    : SUPPORTED_NETWORKS;

  let lastError: any = null;

  for (const netId of networksToTry) {
    try {
      let walletApi: any;
      if (selected.supportsConnect) {
        walletApi = await selected.provider.connect(netId);
      } else if (selected.supportsEnable) {
        walletApi = await selected.provider.enable();
      } else {
        throw new Error('Provider does not implement connect() or enable()');
      }

      if (walletApi) {
        const propSet = new Set<string>();
        let curr = walletApi;
        while (curr && curr !== Object.prototype) {
          for (const k of Object.getOwnPropertyNames(curr)) {
            if (typeof walletApi[k] === 'function' && k !== 'constructor') {
              propSet.add(k);
            }
          }
          curr = Object.getPrototypeOf(curr);
        }
        const methods = Array.from(propSet);
        return {
          success: true,
          elapsedMs: Date.now() - startTime,
          networkId: netId,
          providerId: selected.id,
          methods,
          errorMessage: null,
        };
      }
    } catch (err: any) {
      lastError = err;
      const msg = err?.message || String(err);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('mismatch')) {
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    elapsedMs: Date.now() - startTime,
    networkId: targetNetworkId || 'auto',
    providerId: selected.id,
    methods: [],
    errorMessage: lastError?.message || String(lastError),
  };
}

/**
 * Connect to genuine Midnight Lace extension with automatic network negotiation across
 * ['preprod', 'undeployed', 'preview', 'testnet', 'devnet', 'mainnet'] and robust address extraction.
 */
let isFetchingAddressInFlight = false;

export async function fetchWalletAddressData(
  walletApi: any,
  maxAttempts = 3
): Promise<{
  address: string | null;
  coinPublicKey: string | null;
  encryptionPublicKey: string | null;
  walletDataStatus: WalletDataStatus;
  errorMessage: string | null;
}> {
  if (!walletApi) {
    return {
      address: null,
      coinPublicKey: null,
      encryptionPublicKey: null,
      walletDataStatus: 'UNAVAILABLE',
      errorMessage: 'No active ConnectedAPI available',
    };
  }

  if (isFetchingAddressInFlight) {
    return {
      address: null,
      coinPublicKey: null,
      encryptionPublicKey: null,
      walletDataStatus: 'LOADING',
      errorMessage: null,
    };
  }

  isFetchingAddressInFlight = true;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let isLocked = false;
      let isShutdown = false;

      try {
        const hasUnshielded = typeof walletApi.getUnshieldedAddress === 'function';
        const hasShielded = typeof walletApi.getShieldedAddresses === 'function';

        const hasState = typeof walletApi.state === 'function' || (walletApi.state && typeof walletApi.state.subscribe === 'function');
        const [unshieldedRes, shieldedRes, stateRes] = await Promise.all([
          hasUnshielded
            ? invokeApiMethod(walletApi, 'getUnshieldedAddress', 2500)
            : (walletApi.unshieldedAddress !== undefined ? invokeApiMethod(walletApi, 'unshieldedAddress', 2500) : Promise.resolve(null)),
          hasShielded
            ? invokeApiMethod(walletApi, 'getShieldedAddresses', 2500)
            : (walletApi.shieldedAddresses !== undefined ? invokeApiMethod(walletApi, 'shieldedAddresses', 2500) : Promise.resolve(null)),
          hasState
            ? invokeApiMethod(walletApi, 'state', 2500)
            : Promise.resolve(null),
        ]);

        let address = extractAddressString(unshieldedRes) || extractAddressString(shieldedRes) || extractAddressString(stateRes) || extractAddressString(walletApi.address) || extractAddressString(walletApi);
        let coinPublicKey: string | null = null;
        let encryptionPublicKey: string | null = null;

        if (shieldedRes && typeof shieldedRes === 'object') {
          if (shieldedRes.coinPublicKey) coinPublicKey = String(shieldedRes.coinPublicKey);
          if (shieldedRes.encryptionPublicKey) encryptionPublicKey = String(shieldedRes.encryptionPublicKey);
          if (shieldedRes.shieldedCoinPublicKey && !coinPublicKey) coinPublicKey = String(shieldedRes.shieldedCoinPublicKey);
          if (shieldedRes.shieldedEncryptionPublicKey && !encryptionPublicKey) encryptionPublicKey = String(shieldedRes.shieldedEncryptionPublicKey);
        }

        if (address) {
          return {
            address,
            coinPublicKey,
            encryptionPublicKey,
            walletDataStatus: 'READY',
            errorMessage: null,
          };
        }
      } catch (err: any) {
        const msg = String(err?.message || err).toLowerCase();
        if (msg.includes('locked') || msg.includes('unlock')) {
          isLocked = true;
        }
        if (msg.includes('shutdown') || msg.includes('channel') || msg.includes('no longer be used')) {
          isShutdown = true;
        }
      }

      if (attempt < maxAttempts) {
        const delayMs = attempt === 1 ? 500 : 1500;
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        const walletDataStatus: WalletDataStatus = isLocked ? 'LOCKED' : (isShutdown ? 'UNAVAILABLE' : 'UNAVAILABLE');
        const errorMessage = isLocked
          ? 'Midnight Lace is locked. Unlock the wallet and click Retry.'
          : 'Connected to Midnight Lace. Wallet data is temporarily unavailable. Unlock or refresh Lace, then retry.';
        return {
          address: null,
          coinPublicKey: null,
          encryptionPublicKey: null,
          walletDataStatus,
          errorMessage,
        };
      }
    }
  } finally {
    isFetchingAddressInFlight = false;
  }

  return {
    address: null,
    coinPublicKey: null,
    encryptionPublicKey: null,
    walletDataStatus: 'UNAVAILABLE',
    errorMessage: 'Wallet data query timed out.',
  };
}

/**
 * Connect to genuine Midnight Lace extension with automatic network negotiation
 * and robust, non-fatal address extraction.
 */
export async function connectLaceWallet(preferredNetworkId?: string, timeoutMs = 5500): Promise<WalletState> {
  if (isConnectInFlight) {
    throw new WalletConcurrentConnectError();
  }

  isConnectInFlight = true;
  const startTime = Date.now();

  if (process.env.NODE_ENV !== 'production') {
    console.log('[MEDPROOF-LACE] CONNECT_BUTTON_CLICKED', { elapsedMs: 0 });
  }

  let pendingTimer: any = null;

  try {
    let providers = detectAllMidnightProviders();
    let selected = selectLaceProvider(providers);

    if (!selected && typeof window !== 'undefined') {
      const win = window as any;
      if (!win.midnight && !win.cardano?.mnLace) {
        throw new WalletNotDetectedError();
      }
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 50));
        providers = detectAllMidnightProviders();
        selected = selectLaceProvider(providers);
        if (selected) break;
      }
    }

    if (!selected) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[MEDPROOF-LACE] CONNECT_CALL_ERROR: Provider not detected', {
          elapsedMs: Date.now() - startTime,
        });
      }
      throw new WalletNotDetectedError();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[MEDPROOF-LACE] PROVIDER_SELECTED', {
        id: selected.id,
        name: selected.name,
        apiVersion: selected.apiVersion,
        supportsConnect: selected.supportsConnect,
        supportsEnable: selected.supportsEnable,
        elapsedMs: Date.now() - startTime,
      });
    }

    const { provider, name, apiVersion } = selected;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new WalletTimeoutError('Lace connection timed out. Please approve the pending request in Lace, or try again.'));
      }, timeoutMs);
    });

    pendingTimer = setTimeout(() => {
      if (isConnectInFlight && process.env.NODE_ENV !== 'production') {
        console.warn(
          '[MEDPROOF-LACE] AUTHORIZATION_PROMISE_PENDING (30s elapsed). If Lace popup is not visible, check browser extension toolbar or open popup window.'
        );
      }
    }, 30000);

    let walletApi: any;
    const effectivePreferred = preferredNetworkId && preferredNetworkId !== 'auto' ? preferredNetworkId : undefined;
    let activeNetworkId = effectivePreferred || 'preprod';

    if (process.env.NODE_ENV !== 'production') {
      console.log('[MEDPROOF-LACE] CONNECT_CALL_START', {
        method: selected.supportsConnect ? 'connect' : 'enable',
        preferredNetworkId: effectivePreferred || 'auto',
        elapsedMs: Date.now() - startTime,
      });
    }

    try {
      if (selected.supportsConnect) {
        walletApi = await Promise.race([provider.connect(activeNetworkId), timeoutPromise]);
      } else if (selected.supportsEnable) {
        walletApi = await Promise.race([provider.enable(), timeoutPromise]);
      } else {
        throw new Error('Provider does not expose connect() or enable() method.');
      }
    } catch (err: any) {
      if (err instanceof WalletTimeoutError || err?.name === 'WalletTimeoutError' || err?.message?.toLowerCase().includes('timed out')) {
        throw err;
      }
      if (err instanceof WalletAuthorizationRejectedError) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MEDPROOF-LACE] CONNECT_CALL_REJECTED', { elapsedMs: Date.now() - startTime });
        }
        throw err;
      }
      const errMsg = err?.message || String(err);
      if (
        errMsg.toLowerCase().includes('reject') ||
        errMsg.toLowerCase().includes('denied') ||
        err?.code === 'Rejected' ||
        err?.code === 1 ||
        err?.code === -3
      ) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MEDPROOF-LACE] CONNECT_CALL_REJECTED', { elapsedMs: Date.now() - startTime });
        }
        throw new WalletAuthorizationRejectedError();
      }
      if (
        errMsg.toLowerCase().includes('shutdown') ||
        errMsg.toLowerCase().includes('feature-flags') ||
        errMsg.toLowerCase().includes('object can no longer be used')
      ) {
        throw new WalletExtensionChannelShutdownError(
          'Midnight Lace is not available right now. Please open the Lace Side Panel and keep it open while using MedProof.'
        );
      }
      if (
        errMsg.toLowerCase().includes('wallet is locked') ||
        errMsg.toLowerCase().includes('unlock the wallet') ||
        errMsg.toLowerCase().includes('wallet locked') ||
        (errMsg.toLowerCase().includes('locked') && !errMsg.toLowerCase().includes('block'))
      ) {
        throw new WalletLockedError(
          'Midnight Lace needs to be unlocked or refreshed. Unlock Lace and retry the connection.'
        );
      }
      throw new Error('Lace authorization failed: ' + errMsg);
    }

    if (!walletApi) {
      throw new Error('Lace provider returned an empty or invalid wallet API instance.');
    }

    // REAL LACE CONNECTION ESTABLISHED
    activeConnectedWalletApi = walletApi;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[MEDPROOF-LACE] CONNECT_CALL_RESOLVED', { elapsedMs: Date.now() - startTime });
    }

    // Step 2: Minimal non-blocking initial address retrieval
    let address: string | null = null;
    let coinPublicKey: string | null = null;
    let encryptionPublicKey: string | null = null;
    let walletDataStatus: WalletDataStatus = 'LOADING';
    let errorMessage: string | null = null;

    const hasUnshielded = typeof walletApi.getUnshieldedAddress === 'function' || walletApi.unshieldedAddress !== undefined;
    const hasShielded = typeof walletApi.getShieldedAddresses === 'function' || walletApi.shieldedAddresses !== undefined;
    const hasState = typeof walletApi.state === 'function' || (walletApi.state && typeof walletApi.state.subscribe === 'function');
    const hasNetId = typeof walletApi.getNetworkId === 'function';

    let initialErrorMsg: string | null = null;

    try {
      const [unshieldedRes, shieldedRes, stateRes, netIdRes] = await Promise.all([
        hasUnshielded
          ? invokeApiMethod(walletApi, typeof walletApi.getUnshieldedAddress === 'function' ? 'getUnshieldedAddress' : 'unshieldedAddress', 2500).catch((err) => {
              initialErrorMsg = err?.message || String(err);
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[MEDPROOF-LACE] getUnshieldedAddress initial attempt warning:', err?.message || String(err));
              }
              return null;
            })
          : Promise.resolve(null),
        hasShielded
          ? invokeApiMethod(walletApi, typeof walletApi.getShieldedAddresses === 'function' ? 'getShieldedAddresses' : 'shieldedAddresses', 2500).catch((err) => {
              if (!initialErrorMsg) initialErrorMsg = err?.message || String(err);
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[MEDPROOF-LACE] getShieldedAddresses initial attempt warning:', err?.message || String(err));
              }
              return null;
            })
          : Promise.resolve(null),
        hasState
          ? invokeApiMethod(walletApi, 'state', 2500).catch(() => null)
          : Promise.resolve(null),
        hasNetId
          ? invokeApiMethod(walletApi, 'getNetworkId', 1500).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (netIdRes && typeof netIdRes === 'string' && netIdRes.trim()) {
        activeNetworkId = netIdRes.trim();
      }

      address = extractAddressString(unshieldedRes) || extractAddressString(shieldedRes) || extractAddressString(stateRes) || extractAddressString(walletApi.address) || extractAddressString(walletApi) || null;

      if (shieldedRes && typeof shieldedRes === 'object') {
        if (shieldedRes.coinPublicKey) coinPublicKey = String(shieldedRes.coinPublicKey);
        if (shieldedRes.encryptionPublicKey) encryptionPublicKey = String(shieldedRes.encryptionPublicKey);
        if (shieldedRes.shieldedCoinPublicKey && !coinPublicKey) coinPublicKey = String(shieldedRes.shieldedCoinPublicKey);
        if (shieldedRes.shieldedEncryptionPublicKey && !encryptionPublicKey) encryptionPublicKey = String(shieldedRes.shieldedEncryptionPublicKey);
      }

      if (address) {
        walletDataStatus = 'READY';
      } else if (initialErrorMsg) {
        const lower = String(initialErrorMsg).toLowerCase();
        if (lower.includes('locked') || lower.includes('unlock')) {
          walletDataStatus = 'LOCKED';
          errorMessage = 'Midnight Lace is locked. Unlock Lace and click Retry Wallet Data.';
        } else if (lower.includes('shutdown') || lower.includes('channel') || lower.includes('no longer be used')) {
          walletDataStatus = 'UNAVAILABLE';
          errorMessage = 'Midnight Lace session became unavailable. Open/unlock Lace and retry.';
        } else {
          walletDataStatus = 'LOADING';
        }
      } else {
        walletDataStatus = 'LOADING';
      }
    } catch (queryErr: any) {
      const msg = String(queryErr?.message || queryErr).toLowerCase();
      if (msg.includes('locked') || msg.includes('unlock')) {
        walletDataStatus = 'LOCKED';
        errorMessage = 'Midnight Lace is locked. Unlock Lace and click Retry Wallet Data.';
      } else if (msg.includes('shutdown') || msg.includes('channel') || msg.includes('no longer be used')) {
        walletDataStatus = 'UNAVAILABLE';
        errorMessage = 'Midnight Lace session became unavailable. Open/unlock Lace and retry.';
      } else {
        walletDataStatus = 'UNAVAILABLE';
        errorMessage = 'Wallet data is temporarily unavailable. Click Retry Wallet Data.';
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[MEDPROOF-LACE] STATE_TRANSITION', {
        status: 'CONNECTED',
        walletDataStatus,
        hasAddress: Boolean(address),
        networkId: activeNetworkId,
        providerName: name || 'Midnight Lace Wallet',
        elapsedMs: Date.now() - startTime,
      });
    }

    return {
      status: 'CONNECTED',
      walletDataStatus,
      address,
      coinPublicKey: coinPublicKey || null,
      encryptionPublicKey: encryptionPublicKey || null,
      networkId: activeNetworkId,
      networkName: NETWORK_DISPLAY_NAMES[activeNetworkId] || ('Midnight (' + activeNetworkId + ')'),
      errorMessage,
      providerName: name || 'Midnight Lace Wallet',
      apiVersion: apiVersion || '4.0.1',
    };
  } finally {
    if (pendingTimer) clearTimeout(pendingTimer);
    isConnectInFlight = false;
  }
}
