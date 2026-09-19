import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet, unshieldedToken } from '../src/wallet';
import * as Rx from 'rxjs';

async function main() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  console.log('Waiting for synced state...');
  const state: any = await walletCtx.wallet.waitForSyncedState();
  console.log('Synced! Unshielded available coins:', state.unshielded.availableCoins.length);
  const unregistered = state.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  console.log('Unregistered coins:', unregistered.length);
  if (unregistered.length > 0) {
    for (const c of unregistered) {
      console.log('  Coin value:', c.value, 'ctime:', c.meta?.ctime, 'registered:', c.meta?.registeredForDustGeneration);
    }
    try {
      console.log('Estimating registration fee...');
      const estimation = await walletCtx.wallet.estimateRegistration(unregistered);
      console.log('Fee:', estimation.fee);
      console.log('DUST generation estimations:', estimation.dustGenerationEstimations);
    } catch (err: any) {
      console.error('estimateRegistration error:', err?.message || err);
    }
  }
  await walletCtx.wallet.stop();
}

main().catch(console.error);
