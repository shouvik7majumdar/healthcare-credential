path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/services/lace-wallet-service.ts'
with open(path, 'r') as f:
    content = f.read()

target = '''    // Check if the wallet reported that it is locked
    const isLockedDetected = trace.some(
      (t) => t.toLowerCase().includes('wallet is locked') || t.toLowerCase().includes('unlock the wallet')
    );'''

replacement = '''    // If address query reported locked, give extension worker 400ms to finish keyring unlock and retry once
    if (!address && trace.some((t) => t.toLowerCase().includes('wallet is locked') || t.toLowerCase().includes('unlock the wallet'))) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        if (hasUnshielded) {
          const retryRes = await invokeApiMethod(walletApi, 'getUnshieldedAddress', 3000);
          const ext = extractAddressString(retryRes);
          if (ext) {
            address = ext;
            trace.push('-> resolved unshielded address after unlock retry: ' + ext.substring(0, 12) + '...');
          }
        }
        if (hasShielded && !address) {
          const retryRes = await invokeApiMethod(walletApi, 'getShieldedAddresses', 3000);
          const ext = extractAddressString(retryRes);
          if (ext) {
            address = ext;
            trace.push('-> resolved shielded address after unlock retry: ' + ext.substring(0, 12) + '...');
          }
        }
      } catch {}
    }

    // Check if the wallet STILL reported that it is locked and no address could be retrieved
    const isLockedDetected = !address && trace.some(
      (t) => t.toLowerCase().includes('wallet is locked') || t.toLowerCase().includes('unlock the wallet')
    );'''

if target in content:
    content = content.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(content)
    print('UNLOCK RETRY ADDED')
else:
    print('TARGET NOT FOUND')
