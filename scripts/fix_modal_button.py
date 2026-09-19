path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/components/wallet/WalletModal.tsx'
with open(path, 'r') as f:
    c = f.read()

target = '''        {/* Action Buttons */}
        {hasProvider ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className=
