import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MedProofContractService,
  checkPreprodTxStatus,
  type TransactionStatusUpdate,
} from '../ui/src/services/medproof-contract';
import {
  getConnectedLaceWalletApi,
  setConnectedLaceWalletApi,
  resetLaceConnectionState,
} from '../ui/src/services/lace-wallet-service';

describe('Phase 6C: Real grantConsent Frontend Integration Tests', () => {
  beforeEach(() => {
    resetLaceConnectionState();
    vi.restoreAllMocks();
  });

  describe('Lace Wallet API State Binding', () => {
    it('returns null when no wallet is connected', () => {
      expect(getConnectedLaceWalletApi()).toBeNull();
    });

    it('stores and returns connected wallet API reference', () => {
      const mockApi = {
        balanceUnsealedTransaction: vi.fn(),
        submitTransaction: vi.fn(),
      };
      setConnectedLaceWalletApi(mockApi);
      expect(getConnectedLaceWalletApi()).toBe(mockApi);
    });

    it('clears wallet API reference on resetLaceConnectionState()', () => {
      setConnectedLaceWalletApi({ mock: true });
      resetLaceConnectionState();
      expect(getConnectedLaceWalletApi()).toBeNull();
    });
  });

  describe('executeRealGrantConsent Safety Rules & State Progression', () => {
    const service = new MedProofContractService();
    const validParams = {
      patientSecret: '0x1111111111111111111111111111111111111111111111111111111111111111',
      verifierPk: '0x2222222222222222222222222222222222222222222222222222222222222222',
      credentialCommitment: '0x3333333333333333333333333333333333333333333333333333333333333333',
    };

    it('fails immediately if Lace wallet is not connected', async () => {
      const statusUpdates: TransactionStatusUpdate[] = [];
      await expect(
        service.executeRealGrantConsent({
          ...validParams,
          onStatusChange: (s) => statusUpdates.push(s),
        })
      ).rejects.toThrow(/Midnight Lace wallet is not connected/);

      expect(statusUpdates.some((s) => s.stage === 'failed')).toBe(true);
    });

    it('correctly transitions through preparing and proving before opening Lace', async () => {
      const mockApi = {
        balanceUnsealedTransaction: vi.fn().mockResolvedValue({ tx: 'balanced-hex-001' }),
        submitTransaction: vi.fn().mockResolvedValue('tx-hash-12345'),
      };
      setConnectedLaceWalletApi(mockApi);

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/api/consent/prepare') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                unsealedTxHex: 'unsealed-hex-001',
                consentId: '0xconsent123',
                txIdentifiers: ['tx-id-test'],
              }),
          });
        }
        if (url.includes('indexer.preprod.midnight.network')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  transactions: [{ id: 'tx-1', block: { height: 2600900, timestamp: 1234567890 } }],
                },
              }),
          });
        }
        return Promise.reject(new Error('Unknown fetch: ' + url));
      }) as any;

      const statusUpdates: TransactionStatusUpdate[] = [];
      const result = await service.executeRealGrantConsent({
        ...validParams,
        onStatusChange: (s) => statusUpdates.push(s),
      });

      expect(result.success).toBe(true);
      expect(result.consentId).toBe('0xconsent123');
      expect(result.txHash).toBe('tx-hash-12345');
      expect(result.blockHeight).toBe(2600900);

      const stages = statusUpdates.map((s) => s.stage);
      expect(stages).toContain('preparing');
      expect(stages).toContain('proving');
      expect(stages).toContain('waiting_approval');
      expect(stages).toContain('submitting');
      expect(stages).toContain('confirming');
      expect(stages).toContain('confirmed');

      expect(mockApi.balanceUnsealedTransaction).toHaveBeenCalledWith('unsealed-hex-001');
      expect(mockApi.submitTransaction).toHaveBeenCalledWith('balanced-hex-001');
    });

    it('handles human rejection in Lace cleanly without declaring fake success', async () => {
      const mockApi = {
        balanceUnsealedTransaction: vi.fn().mockRejectedValue(new Error('User rejected transaction')),
        submitTransaction: vi.fn(),
      };
      setConnectedLaceWalletApi(mockApi);

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url === '/api/consent/prepare') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                unsealedTxHex: 'unsealed-hex-001',
                consentId: '0xconsent123',
              }),
          });
        }
        return Promise.reject(new Error('Unknown fetch: ' + url));
      }) as any;

      const statusUpdates: TransactionStatusUpdate[] = [];
      await expect(
        service.executeRealGrantConsent({
          ...validParams,
          onStatusChange: (s) => statusUpdates.push(s),
        })
      ).rejects.toThrow(/Transaction rejected by user in Lace/);

      expect(statusUpdates.some((s) => s.stage === 'rejected')).toBe(true);
      expect(mockApi.submitTransaction).not.toHaveBeenCalled();
    });
  });
});
