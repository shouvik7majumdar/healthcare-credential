path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/components/navigation/Header.tsx'
with open(path, 'r') as f:
    content = f.read()

target = '''  const handleConnectClick = async () => {
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

replacement = '''  const handleConnectClick = async () => {
    if (wallet.status === 'UNAVAILABLE' || wallet.status === 'WAITING_FOR_LACE' || wallet.status === 'CONNECTING') {
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

target_button = '''            <button
              className=
