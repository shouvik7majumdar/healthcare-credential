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

target_btn_text = ''': wallet.status === 'WAITING_FOR_LACE'
                ? '⏳ Waiting for Lace...''''

replacement_btn_text = ''': wallet.status === 'WAITING_FOR_LACE'
                ? '⚡ Retry Connection''''

if target in c:
    c = c.replace(target, replacement)
if target_btn_text in c:
    c = c.replace(target_btn_text, replacement_btn_text)

with open(path, 'w') as f:
    f.write(c)

print('HEADER RECONNECT UPDATED')
