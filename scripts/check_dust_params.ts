import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';

async function main() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  const s: any = await walletCtx.wallet.waitForSyncedState();
  console.log('Synced!');
  const dustState = s.dust.state;
  console.log('Dust params:', dustState?.parameters);
  console.log('Dust parameters string:', dustState?.parameters?.toString?.());
  await walletCtx.wallet.stop();
}

main().catch(console.error);
