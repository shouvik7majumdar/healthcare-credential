import re

with open('/home/user/midnight-projects/confidential-prescription-verification/scripts/metadata.hex') as f:
    raw = bytes.fromhex(f.read().strip()[2:])

pos = raw.find(b'OutOfDustValidityWindow')
slice_bytes = raw[pos:pos+500]
matches = re.findall(b'[a-zA-Z0-9_ .,;:-]{4,}', slice_bytes)
for m in matches:
    print(m.decode())
