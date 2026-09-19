import re

with open('/home/user/midnight-projects/confidential-prescription-verification/scripts/metadata.hex') as f:
    raw = bytes.fromhex(f.read().strip()[2:])

pos = raw.find(b'OutOfDustValidityWindow')
print('Found at:', pos)

# Find the pallet name preceding this error
pallets = [m.start() for m in re.finditer(b'pallet_', raw)]
print('Pallets near error:')
for p in pallets:
    if abs(p - pos) < 5000:
        print('  ', p, raw[p:p+30])
