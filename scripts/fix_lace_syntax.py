path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/services/lace-wallet-service.ts'
with open(path, 'r') as f:
    content = f.read()

bad_block = '''    try {
      if (selected.supportsConnect) {
        walletApi = await Promise.race([provider.connect(activeNetworkId), timeoutPromise]);
      } else if (selected.supportsEnable) {
        walletApi = await Promise.race([provider.enable(), timeoutPromise]);
      } else {
        throw new Error('Provider does not expose connect() or enable() method.');
      }
    } catch (err: any) {
      if (err instanceof WalletAuthorizationRejectedError) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[MEDPROOF-LACE] CONNECT_CALL_REJECTED', { elapsedMs: Date.now() - startTime });
        }
        throw err;
      }
              errMsg.toLowerCase().includes('reject') ||
        errMsg.toLowerCase().includes('denied') ||
        err?.code === 'Rejected' ||
        err?.code === 1 ||
        err?.code === -3
      ) {'''

good_block = '''    try {
      if (selected.supportsConnect) {
        walletApi = await Promise.race([provider.connect(activeNetworkId), timeoutPromise]);
      } else if (selected.supportsEnable) {
        walletApi = await Promise.race([provider.enable(), timeoutPromise]);
      } else {
        throw new Error('Provider does not expose connect() or enable() method.');
      }
    } catch (err: any) {
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
      ) {'''

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open(path, 'w') as f:
        f.write(content)
    print('SYNTAX FIXED')
else:
    print('BAD BLOCK NOT MATCHED')
