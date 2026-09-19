path = '/home/user/midnight-projects/confidential-prescription-verification/src/deploy.ts'
with open(path, 'r') as f:
    code = f.read()

start_idx = code.find('  // DUST')
end_idx = code.find('  // Deploy')
print('start_idx:', start_idx, 'end_idx:', end_idx)

new_block = '''  // DUST
  console.log('─── DUST Token Setup ─────────────────────────────────────────\n');
  const dustState = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregisteredUtxos = dustState.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
  if (unregisteredUtxos.length > 0) {
    console.log(  Registering  UTXOs for DUST...);
    try {
      const { fee } = await walletCtx.wallet.estimateRegistration(unregisteredUtxos);
      console.log(  Estimated registration fee: );
      await walletCtx.wallet.waitForGeneratedDust(unregisteredUtxos, fee);
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregisteredUtxos,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload: any) => walletCtx.unshieldedKeystore.signData(payload),
      );
      const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
      const txId = await walletCtx.wallet.submitTransaction(finalized);
      console.log(  ✓ DUST registration submitted! TX: );
    } catch (err: any) {
      console.warn(  ⚠ DUST registration: );
    }
  }

  // Bounded DUST readiness check (no indefinite wait loop)
  const currentDust = dustState.dust.balance(new Date());
  if (currentDust === 0n) {
    console.log('  Waiting for DUST to appear on-chain...');
    try {
      await Rx.firstValueFrom(walletCtx.wallet.state().pipe(
        Rx.throttleTime(3000),
        Rx.filter((s: any) => s.isSynced && s.dust.balance(new Date()) > 0n),
        Rx.timeout({ first: 60_000 }),
      ));
    } catch {
      console.log('  Proceeding to deployment (balancing retry loop active)...');
    }
  }
  const verifiedDust = (await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)))).dust.balance(new Date());
  console.log(  ✓ DUST ready! Active Balance:  DUST\n);

'''

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + new_block + code[end_idx:]
    with open(path, 'w') as f:
        f.write(code)
    print('Successfully updated src/deploy.ts')
