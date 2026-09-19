import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet, persistWalletState } from '../src/wallet';
import * as Rx from 'rxjs';

async function main() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  console.log('Waiting for synced state...');
  const state: any = await walletCtx.wallet.waitForSyncedState();
  const unregistered = state.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  console.log('Unregistered UTXOs count:', unregistered.length);

  if (unregistered.length > 0) {
    console.log('Estimating registration fee...');
    const { fee } = await walletCtx.wallet.estimateRegistration(unregistered);
    console.log('Estimated Fee:', fee);

    console.log('Calling waitForGeneratedDust...');
    await walletCtx.wallet.waitForGeneratedDust(unregistered, fee);
    console.log('waitForGeneratedDust completed!');

    console.log('Creating registration recipe...');
    const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
      unregistered,
      walletCtx.unshieldedKeystore.getPublicKey(),
      (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
    );

    console.log('Finalizing recipe (proof generation & binding)...');
    const finalized = await walletCtx.wallet.finalizeRecipe(recipe);

    console.log('Submitting registration transaction...');
    const txId = await walletCtx.wallet.submitTransaction(finalized);
    console.log('Submitted! Transaction ID:', txId);

    console.log('Waiting for DUST to appear in wallet state...');
    const dustState = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(3000),
        Rx.filter((s: any) => s.isSynced && s.dust.balance(new Date()) > 0n),
        Rx.timeout({ first: 180_000 }),
      ),
    );
    console.log('DUST confirmed active! Balance:', dustState.dust.balance(new Date()));
  } else {
    console.log('UTXO already registered! DUST balance:', state.dust.balance(new Date()));
  }

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
  console.log('DUST PREPARATION COMPLETE');
}

main().catch((err) => {
  console.error('DUST preparation failed:', err);
  process.exit(1);
});
