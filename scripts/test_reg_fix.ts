import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';
import * as Rx from 'rxjs';

async function main() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  console.log('Waiting for synced state...');
  const state: any = await walletCtx.wallet.waitForSyncedState();
  const unregistered = state.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  console.log('Unregistered count:', unregistered.length);
  if (unregistered.length > 0) {
    const { fee } = await walletCtx.wallet.estimateRegistration(unregistered);
    console.log('Estimated Fee:', fee);
    console.log('Calling waitForGeneratedDust...');
    await walletCtx.wallet.waitForGeneratedDust(unregistered, fee);
    console.log('waitForGeneratedDust completed!');
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregistered,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
    );
    console.log('Recipe type:', recipe.type);
    console.log('Submitting registration transaction...');
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
    const txId = await walletCtx.wallet.submitTransaction(finalized);
    console.log('? Submitted! Transaction ID:', txId);
  }
  await walletCtx.wallet.stop();
}

main().catch(console.error);
