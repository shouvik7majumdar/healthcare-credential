path = '/home/user/midnight-projects/confidential-prescription-verification/ui/src/components/navigation/Header.tsx'
with open(path, 'r') as f:
    c = f.read()

c = c.replace('disabled={wallet.status === \'CONNECTING\' || wallet.status === \'WAITING_FOR_LACE\'}', 'disabled={false}')
c = c.replace('if (wallet.status === \'UNAVAILABLE\') {', 'if (wallet.status === \'UNAVAILABLE\' || wallet.status === \'WAITING_FOR_LACE\') {')

with open(path, 'w') as f:
    f.write(c)
print('SUCCESS')
