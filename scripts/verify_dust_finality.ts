import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';
import * as Rx from 'rxjs';

async function main() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  console.log('Syncing wallet...');
  const state: any = await walletCtx.wallet.waitForSyncedState();
  const addr = walletCtx.unshieldedKeystore.getBech32Address().toString();
  console.log('Wallet Address:', addr);
  console.log('Available Coins Count:', state.unshielded.availableCoins.length);
  for (const c of state.unshielded.availableCoins) {
    console.log('  Coin value:', c.utxo?.value ?? c.value);
    console.log('  Coin registered:', c.meta?.registeredForDustGeneration);
    console.log('  Coin ctime:', c.meta?.ctime);
  }
  const dustBal = state.dust.balance(new Date());
  console.log('Active DUST balance:', dustBal);
  await walletCtx.wallet.stop();
}

main().catch(console.error);
