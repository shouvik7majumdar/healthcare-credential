import { resolveNetwork, getOrCreateSeed } from '../src/network';
import { createWallet } from '../src/wallet';
import * as Rx from 'rxjs';

async function check() {
  const { network, config } = resolveNetwork();
  const seed = getOrCreateSeed('preprod');
  const walletCtx = await createWallet({ network, networkConfig: config, seed, restore: true });
  const s: any = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((x: any) => x.isSynced)));
  console.log('Unshielded coins:', s.unshielded.availableCoins.length);
  for (const c of s.unshielded.availableCoins) {
    console.log('  Coin value:', c.value, 'meta:', c.meta);
  }
  console.log('Dust balance now:', s.dust.balance(new Date()));
  console.log('Dust balance +1h:', s.dust.balance(new Date(Date.now() + 3600000)));
  const dustCoins = s.dust.capabilities?.coinsAndBalances?.getTotalCoins?.(s.dust.state, new Date());
  console.log('Total dust coins:', dustCoins?.length);
  await walletCtx.wallet.stop();
}
check().catch(console.error);
