path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/components/navigation/Header.tsx'
with open(path, 'r') as f:
    c = f.read()

target = '''  const handleConnectClick = async () => {
    if (wallet.status === 'UNAVAILABLE' || wallet.status === 'WAITING_FOR_LACE') {
      setIsWalletModalOpen(true);
      return;
    }
    if (hasProvider || selectedWallet) {
      try {
        await connect('preprod');
      } catch {
        setIsWalletModalOpen(true);
      }
    } else {
      setIsWalletModalOpen(true);
    }
  };'''

replacement = '''  const handleConnectClick = async () => {
    if (wallet.status === 'WAITING_FOR_LACE' || wallet.status === 'LOCKED' || wallet.status === 'ERROR' || wallet.status === 'REJECTED') {
      cancelConnection();
      try {
        await connect('preprod');
      } catch {
        setIsWalletModalOpen(true);
      }
      return;
    }
    if (wallet.status === 'UNAVAILABLE') {
      setIsWalletModalOpen(true);
      return;
    }
    if (hasProvider || selectedWallet) {
      try {
        await connect('preprod');
      } catch {
        setIsWalletModalOpen(true);
      }
    } else {
      setIsWalletModalOpen(true);
    }
  };'''

if target in c:
    c = c.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(c)
    print('UPDATED SUCCESSFULLY')
else:
    print('TARGET NOT MATCHED')
