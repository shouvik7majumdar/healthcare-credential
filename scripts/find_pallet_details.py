with open('/home/user/midnight-projects/confidential-prescription-verification/scripts/metadata.hex') as f:
    raw = bytes.fromhex(f.read().strip()[2:])

import re

# Search for storage items of pallet_midnight
pos = raw.find(b'pallet_midnight')
while pos != -1:
    slice_data = raw[pos:pos+400]
    words = re.findall(b'[A-Za-z0-9_]{3,}', slice_data)
    print('Match at', pos, ':', [w.decode() for w in words[:15]])
    pos = raw.find(b'pallet_midnight', pos+1)
